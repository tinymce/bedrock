import * as chalk from 'chalk';
import * as Serve from './bedrock/server/Serve';
import { Attempt } from './bedrock/core/Attempt';
import * as Version from './bedrock/core/Version';
import * as RunnerRoutes from './bedrock/server/RunnerRoutes';
import * as Reporter from './bedrock/core/Reporter';
import * as DriverMaster from './bedrock/server/DriverMaster';
import * as Driver from './bedrock/auto/Driver';
import * as Tunnel from './bedrock/auto/Tunnel';
import * as Lifecycle from './bedrock/core/Lifecycle';
import { BedrockAutoSettings } from './bedrock/core/Settings';
import { ExitCodes } from './bedrock/util/ExitCodes';
import * as ConsoleReporter from './bedrock/core/ConsoleReporter';
import * as SettingsResolver from './bedrock/core/SettingsResolver';
import * as portfinder from 'portfinder';
import { format } from 'node:util';

const remoteWebdriverMap: Record<string, string> = {
  'chrome': 'AWS',
  'firefox': 'AWS',
  'safari': 'LambdaTest'
};

export const go = (bedrockAutoSettings: BedrockAutoSettings): void => {
  console.log('bedrock-auto ' + Version.get() + ' starting...');

  const settings = SettingsResolver.resolveAndLog(bedrockAutoSettings);
  console.log('Bedrock settings:', settings);
  const master = DriverMaster.create();
  const browserName = settings.browser.replace('-headless', '');
  const isPhantom = browserName === 'phantomjs';
  const isHeadless = settings.browser.endsWith('-headless') || isPhantom;
  const basePage = 'src/resources/html/' + (isPhantom ? 'bedrock-phantom.html' : 'bedrock.html');
  const remoteWebdriver = settings.remote ? remoteWebdriverMap[settings.browser] : undefined;

  const routes = RunnerRoutes.generate('auto', settings.projectdir, settings.basedir, settings.config, settings.bundler, settings.testfiles, settings.chunk, settings.retries, settings.singleTimeout, settings.stopOnFailure, basePage, settings.coverage, settings.polyfills);

  routes.then(async (runner) => {
    console.log('Creating webdriver...');
    if (remoteWebdriver == 'AWS') {
        console.log('INFO: Webdriver creation waits for device farm session to activate. Takes 30-45s.');
    }

    const shutdownServices: (() => Promise<any>)[] = [];

    // LambdaTest Tunnel must know dev server port, but tunnel must be created before dev server.
    let servicePort: number | undefined;
    if (remoteWebdriver === 'LambdaTest') {
      servicePort = await portfinder.getPortPromise({
        port: 8000,
        stopPort: 20000
      });
      const tunnel = await Tunnel.create(remoteWebdriver, servicePort);
      shutdownServices.push(tunnel.shutdown);
    }

    const driver = await Driver.create({
      browser: browserName,
      basedir: settings.basedir,
      headless: isHeadless,
      debuggingPort: settings.debuggingPort,
      useSandboxForHeadless: settings.useSandboxForHeadless,
      extraBrowserCapabilities: settings.extraBrowserCapabilities,
      verbose: settings.verbose,
      wipeBrowserCache: settings.wipeBrowserCache,
      remoteWebdriver
    });

    const webdriver = driver.webdriver;
    const service = await Serve.start({
      ...settings,
      driver: Attempt.passed(webdriver),
      master,
      runner,
      stickyFirstSession: true
    });
    shutdownServices.push(service.shutdown);

    let location;
    if (remoteWebdriver === 'AWS') {
      const tunnel = await Tunnel.create(remoteWebdriver, service.port);
      location = tunnel.url.href;
      shutdownServices.push(driver.shutdown, tunnel.shutdown);
    } else {
      location = 'http://localhost:' + service.port;
      shutdownServices.push(driver.shutdown);
    }

    try {
      if (!isHeadless) {
        console.log('bedrock-auto ' + Version.get() + ' available at: ' + location);
      }

      console.log('Loading initial page...');
      await webdriver.url(location);
      console.log(isPhantom ? '\nPhantom tests loading ...\n' : '\nInitial page has loaded ...\n');
      service.markLoaded();
      service.enableHud();

      const result = await service.awaitDone().then((data) => {
        ConsoleReporter.printReport(data);
        return Reporter.write(settings, data);
      }, (data) => {
        ConsoleReporter.printReport(data);
        return Reporter.writePollExit(settings, data);
      });

      // Combine all shutdowns into single function call.
      const shutdown = () => Promise.all(shutdownServices.map((shutdown_fn) => shutdown_fn()));
      return Lifecycle.done(result, webdriver, shutdown, settings.gruntDone, settings.delayExit);
    } catch (e) {
      // Combine all shutdowns into single function call.
      const shutdown = () => Promise.all(shutdownServices.map((shutdown_fn) => shutdown_fn()));
      return Lifecycle.error(e, webdriver, shutdown, settings.gruntDone, settings.delayExit);
    }
  }).catch((err) => {
    // Chalk does not use a formatter. Using node's built-in to expand Objects, etc.
    console.error(chalk.red('Error creating webdriver', format(err)));
    Lifecycle.exit(settings.gruntDone, ExitCodes.failures.unexpected);
  });
};

export const mode = 'forAuto';
