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

export const go = (bedrockAutoSettings: BedrockAutoSettings): void => {
  console.log('bedrock-auto ' + Version.get() + ' starting...');

  const settings = SettingsResolver.resolveAndLog(bedrockAutoSettings);
  const master = DriverMaster.create();
  const browserName = settings.browser.replace('-headless', '');
  const isPhantom = browserName === 'phantomjs';
  const isHeadless = settings.browser.endsWith('-headless') || isPhantom;
  const basePage = 'src/resources/html/' + (isPhantom ? 'bedrock-phantom.html' : 'bedrock.html');
  // Remote settings
  const remoteWebdriver = settings.remote;
  const sishDomain = settings.sishDomain;
  const username = settings.username ?? process.env.LT_USERNAME;
  const accesskey = settings.accesskey ?? process.env.LT_ACCESS_KEY;

  const routes = RunnerRoutes.generate('auto', settings.projectdir, settings.basedir, settings.config, settings.bundler, settings.testfiles, settings.chunk, settings.retries, settings.singleTimeout, settings.stopOnFailure, basePage, settings.coverage, settings.polyfills);

  const shutdownServices: ((immediate?: boolean) => Promise<void>)[] = [];
  const shutdown = (services: ((immediate?: boolean) => Promise<void>)[]) => (immediate?: boolean) => Promise.allSettled(services.map((fn) => fn(immediate)));

  routes.then(async (runner) => {

    // LambdaTest Tunnel must know dev server port, but tunnel must be created before dev server.
    const servicePort = await portfinder.getPortPromise({
      port: 8000,
      stopPort: 20000
    });

    const tunnelCredentials = {
      user: username,
      key: accesskey
    };

    const tunnel = await Tunnel.prepareConnection(servicePort, remoteWebdriver, sishDomain, tunnelCredentials);
    shutdownServices.push(tunnel.shutdown);
    const location = tunnel.url.href;

    console.log('Creating webdriver...');
    if (remoteWebdriver == 'aws') {
        console.log('INFO: Webdriver creation waits for device farm session to activate. Takes 30-45s.');
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
      remoteWebdriver,
      webdriverPort: settings.webdriverPort,
      useSelenium: settings.useSelenium,
      username,
      accesskey,
      devicefarmRegion: settings.devicefarmRegion,
      deviceFarmArn: settings.devicefarmArn,
      browserVersion: settings.browserVersion,
      platformName: settings.platformName,
      tunnel,
      name: settings.name ? settings.name : 'bedrock-auto'
    });

    const webdriver = driver.webdriver;
    const service = await Serve.start({
      ...settings,
      driver: Attempt.passed(webdriver),
      master,
      runner,
      stickyFirstSession: true,
      port: servicePort
    });
    shutdownServices.push(service.shutdown, driver.shutdown);

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

      return Lifecycle.done(result, webdriver, shutdown(shutdownServices), settings.gruntDone, settings.delayExit);
    } catch (e) {
      return Lifecycle.error(e as any, webdriver, shutdown(shutdownServices), settings.gruntDone, settings.delayExit);
    }
  }).catch(async (err) => {
    // Chalk does not use a formatter. Using node's built-in to expand Objects, etc.
    console.error(chalk.red('Error creating webdriver', format(err)));
    // Shutdown tunnels in case webdriver fails
    await shutdown(shutdownServices)(true);
    Lifecycle.exit(settings.gruntDone, ExitCodes.failures.unexpected);
  });
};

export const mode = 'forAuto';
