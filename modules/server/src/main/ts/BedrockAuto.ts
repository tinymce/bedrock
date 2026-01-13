import chalk from 'chalk';
import * as Serve from './bedrock/server/Serve.js';
import { Attempt } from './bedrock/core/Attempt.js';
import * as Version from './bedrock/core/Version.js';
import * as RunnerRoutes from './bedrock/server/RunnerRoutes.js';
import * as Reporter from './bedrock/core/Reporter.js';
import * as DriverMaster from './bedrock/server/DriverMaster.js';
import * as Driver from './bedrock/auto/Driver.js';
import * as Tunnel from './bedrock/auto/Tunnel.js';
import * as Lifecycle from './bedrock/core/Lifecycle.js';
import { BedrockAutoSettings } from './bedrock/core/Settings.js';
import { ExitCodes } from './bedrock/util/ExitCodes.js';
import * as ConsoleReporter from './bedrock/core/ConsoleReporter.js';
import * as SettingsResolver from './bedrock/core/SettingsResolver.js';
import { format } from 'node:util';
import { defer } from './bedrock/util/Waiter.js';
import { Browser } from 'webdriverio';

async function makeWebDriver(settings: BedrockAutoSettings, servicePort: number, shutdownServices: ((immediate?: boolean) => Promise<void>)[], browserName: string, isHeadless: boolean) {
  // Remote settings
  const remoteWebdriver = settings.remote;
  const sishDomain = settings.sishDomain;
  const username = settings.username ?? process.env.LT_USERNAME;
  const accesskey = settings.accesskey ?? process.env.LT_ACCESS_KEY;
  const tunnelCredentials = {
    user: username,
    key: accesskey
  };

  const tunnel = await Tunnel.prepareConnection(servicePort, remoteWebdriver, sishDomain, tunnelCredentials);
  shutdownServices.push(tunnel.shutdown);
  const location = tunnel.url.href;

  console.log(`Creating ${ remoteWebdriver ?? 'local' } webdriver...`);
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
  shutdownServices.push(driver.shutdown);

  const webdriver = driver.webdriver;
  return { location, webdriver };
}

export const go = async (bedrockAutoSettings: BedrockAutoSettings): Promise<void> => {
  console.log('bedrock-auto ' + Version.get() + ' starting...');

  const settings = SettingsResolver.resolveAndLog(bedrockAutoSettings);
  const master = DriverMaster.create();
  const browserName = settings.browser.replace('-headless', '');
  const isPhantom = browserName === 'phantomjs';
  const isHeadless = settings.browser.endsWith('-headless') || isPhantom;
  const basePage = 'src/resources/html/' + (isPhantom ? 'bedrock-phantom.html' : 'bedrock.html');

  const shutdownServices: ((immediate?: boolean) => Promise<void>)[] = [];
  const shutdown = (services: ((immediate?: boolean) => Promise<void>)[]) => (immediate?: boolean) => Promise.allSettled(services.map((fn) => fn(immediate)));

  try {
    const driverDeferred = defer<Attempt<unknown, Browser>>();

    const scratchDir = settings.name ? `scratch_${settings.name}` : 'bedrock';

    const routes = RunnerRoutes.generate('auto', settings.projectdir, settings.basedir, scratchDir, settings.config, settings.bundler, settings.testfiles, settings.chunk, settings.retries, settings.singleTimeout, settings.stopOnFailure, basePage, settings.coverage, settings.polyfills);

    const service = await Serve.start({
      ...settings,
      driver: driverDeferred.promise,
      master,
      runner: routes,
      stickyFirstSession: true
    });

    const driverPromise = makeWebDriver(settings, service.port, shutdownServices, browserName, isHeadless);
    driverPromise.then(({ webdriver }) => {
      driverDeferred.resolve(Attempt.passed(webdriver));
    }).catch((e) => {
      driverDeferred.resolve(Attempt.failed(e));
    });

    shutdownServices.push(service.shutdown);

    const { location, webdriver } = await driverPromise;
    console.log('Started webdriver session: ', webdriver.sessionId);

    const cancelEverything = Lifecycle.cancel(webdriver, shutdown(shutdownServices), settings.gruntDone);
    process.on('SIGINT', cancelEverything);
    process.on('SIGQUIT', cancelEverything);
    process.on('SIGTERM', cancelEverything);

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
  } catch(err) {
    // Chalk does not use a formatter. Using node's built-in to expand Objects, etc.
    console.error(chalk.red('Error creating webdriver', format(err)));
    // Shutdown tunnels in case webdriver fails
    await shutdown(shutdownServices)(true);
    return Lifecycle.exit(settings.gruntDone, ExitCodes.failures.unexpected);
  }
};

export const mode = 'forAuto';
