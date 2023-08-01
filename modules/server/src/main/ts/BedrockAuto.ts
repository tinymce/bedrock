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

export const go = (bedrockAutoSettings: BedrockAutoSettings): void => {
  console.log('bedrock-auto ' + Version.get() + ' starting...');

  const settings = SettingsResolver.resolveAndLog(bedrockAutoSettings);
  console.log('settings: ', settings);
  const master = DriverMaster.create();
  const browserName = settings.browser.replace('-headless', '');
  const isPhantom = browserName === 'phantomjs';
  const isHeadless = settings.browser.endsWith('-headless') || isPhantom;
  const basePage = 'src/resources/html/' + (isPhantom ? 'bedrock-phantom.html' : 'bedrock.html');

  const routes = RunnerRoutes.generate('auto', settings.projectdir, settings.basedir, settings.config, settings.bundler, settings.testfiles, settings.chunk, settings.retries, settings.singleTimeout, settings.stopOnFailure, basePage, settings.coverage, settings.polyfills);

  routes.then(async (runner) => {

    if (settings.remote) {
        console.log('Webdriver creation waits for device farm session to activate. Takes 30-45s.');
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
      remote: settings.remote
    });

    const webdriver = driver.webdriver;
    const service = await Serve.start({
      ...settings,
      driver: Attempt.passed(webdriver),
      master,
      runner,
      stickyFirstSession: true
    });

    // TODO: Extensible. This is not a great way to do this but I can't think of a clean, easy way to fix it.
    let shutdown;
    let location;
    if (settings.remote) {
      const tunnel = await Tunnel.create(service.port);
      location = tunnel.url.href;
      shutdown = () => Promise.all([ service.shutdown(), driver.shutdown(), tunnel.shutdown()]);
    } else {
      location = 'http://localhost:' + service.port;
      shutdown = () => Promise.all([ service.shutdown(), driver.shutdown()]);
    }

    try {
      if (!isHeadless) {
        console.log('bedrock-auto ' + Version.get() + ' available at: ' + location);
      }

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

      return Lifecycle.done(result, webdriver, shutdown, settings.gruntDone, settings.delayExit);
    } catch (e) {
      return Lifecycle.error(e, webdriver, shutdown, settings.gruntDone, settings.delayExit);
    }
  }).catch((err) => {
    console.error(chalk.red(err));
    Lifecycle.exit(settings.gruntDone, ExitCodes.failures.unexpected);
  });
};

export const mode = 'forAuto';
