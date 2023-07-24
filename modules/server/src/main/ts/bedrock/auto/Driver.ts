import * as path from 'path';
import * as childProcess from 'child_process';
import * as os from 'os';
import * as WebdriverIO from 'webdriverio';
import * as portfinder from 'portfinder';
import * as Shutdown from '../util/Shutdown';
import * as DriverLoader from './DriverLoader';
import { DeviceFarmClient, CreateTestGridUrlCommand } from '@aws-sdk/client-device-farm';

export interface DriverSettings {
  basedir: string;
  browser: string;
  headless: boolean;
  debuggingPort?: number;
  useSandboxForHeadless: boolean;
  extraBrowserCapabilities: string;
  verbose: boolean;
  webdriverPort?: number;
  webdriverTimeout?: number;
  wipeBrowserCache?: boolean;
  farm?: boolean;
}

export interface Driver {
  webdriver: WebdriverIO.Browser<'async'>;
  shutdown: (immediate?: boolean) => Promise<void>;
}

const browserVariants: Record<string, string> = {
  'edge': 'MicrosoftEdge',
  'ie': 'internet explorer'
};

const cscriptFocus = (basedir: string, script: string) => {
  return new Promise<void>((resolve) => {
    const focusScript = path.join(basedir, 'bin/focus/' + script);
    childProcess.exec('cscript ' + focusScript, () => resolve());
  });
};

// Mac doesn't focus windows opened through automation, so use AppleScript to do it for us
const focusMac = (basedir: string, browser: string) => {
  if (browser === 'phantomjs') {
    return Promise.resolve();
  } else {
    return new Promise<void>((resolve) => {
      const macFocusScript = path.join(basedir, 'bin/focus/mac.applescript');
      childProcess.exec(`osascript ${macFocusScript} ${browser}`, () => resolve());
    });
  }
};

const focusWindows = (basedir: string, browser: string) => {
  if (browser === 'MicrosoftEdge') {
    // Makes sure that Edge has proper focus and is the top most window
    return cscriptFocus(basedir, 'edge.js');
  } else if (browser === 'firefox') {
    // Firefox insists on having focus in the address bar, and while F6 will focus the body
    // mozilla haven't implemented browser-wide sendkeys in their webdriver
    return cscriptFocus(basedir, 'winff.js');
  } else {
    return Promise.resolve();
  }
};

const addArguments = (capabilities: Record<string, any>, name: string, args: string[]) => {
  if (!capabilities.hasOwnProperty(name)) {
    capabilities[name] = { args: [] };
  }
  const currentArgs = capabilities[name].args || [];
  capabilities[name].args = currentArgs.concat(args);
};

const getExtraBrowserCapabilities = (settings: DriverSettings): string[] => {
  const extraCaps = settings.extraBrowserCapabilities.trim();
  if (extraCaps.length > 0) {
    return extraCaps.split(' ');
  } else {
    return [];
  }
};

const getOptions = (port: number, browserName: string, settings: DriverSettings, debuggingPort: number): WebdriverIO.RemoteOptions => {
  const options: WebdriverIO.RemoteOptions = {
    path: '/',
    hostname: '127.0.0.1',
    port,
    logLevel: 'trace' as const,
    capabilities: {
      browserName
    }
  };

  // NOTE: We are currently not supporting extra browser capabilities for IE, Legacy Edge,
  // or Chromium-based Edge. We should start supporting extra browser capabilities for Chromium-based
  // Edge, though.
  const extraCaps = getExtraBrowserCapabilities(settings);

  // Support for disabling the Automation Chrome Extension
  // https://stackoverflow.com/questions/43261516/selenium-chrome-i-just-cant-use-driver-maximize-window-to-maximize-window
  const caps: Record<string, any> = options.capabilities;
  if (browserName === 'chrome') {
    addArguments(caps, 'goog:chromeOptions', ['--start-maximized', '--disable-extensions']);
    addArguments(caps, 'goog:chromeOptions', extraCaps);
  } else if (browserName === 'firefox') {
    addArguments(caps, 'moz:firefoxOptions', extraCaps);
  } else if (browserName === 'internet explorer' && settings.wipeBrowserCache) {
    // Setup wiping the browser cache if required, as IE 11 doesn't use a clean session by default
    caps['se:ieOptions'] = {
      'ie.ensureCleanSession': true
    };
  }

  // Setup any headless mode options
  if (settings.headless) {
    if (browserName === 'firefox') {
      // https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Headless_mode#Debugging_headless_Firefox
      addArguments(caps, 'moz:firefoxOptions', [ '-headless', '-start-debugger-server=' + debuggingPort ]);
      caps['moz:firefoxOptions'].prefs = {
        'devtools.debugger.remote-enabled': true,
        'devtools.debugger.prompt-connection': false,
        'devtools.chrome.enabled': true
      };
    } else if (browserName === 'chrome') {
      addArguments(caps, 'goog:chromeOptions', [ '--headless', '--remote-debugging-port=' + debuggingPort ]);
      if (settings.useSandboxForHeadless) {
        addArguments(caps, 'goog:chromeOptions', [ '--no-sandbox' ]);
      }
    }
  }

  return options;
};

const logDriverDetails = (driver: WebdriverIO.Browser<'async'>, headless: boolean, debuggingPort: number) => {
  const caps: Record<string, any> = driver.capabilities;
  const browserName = caps.browserName;
  const browserVersion = caps.browserVersion || caps.version;

  if (browserName === 'chrome') {
    console.log('browser:', browserVersion, 'driver:', caps.chrome.chromedriverVersion);
  } else if (browserName === 'firefox') {
    console.log('browser:', browserVersion, 'driver:', caps['moz:geckodriverVersion']);
  } else if (browserName === 'phantomjs') {
    console.log('browser:', browserVersion, 'driver:', caps.driverVersion);
  } else if (browserName === 'MicrosoftEdge') {
    console.log('browser:', browserVersion);
  } else if (browserName === 'msedge') {
    console.log('browser:', browserVersion, 'driver:', caps.msedge.msedgedriverVersion);
  }

  if (headless) {
    console.log('browser debugger available at: http://localhost:' + debuggingPort);
  }
};

const focusBrowser = (browserName: string, settings: DriverSettings) => {
  if (os.platform() === 'darwin') {
    return focusMac(settings.basedir, browserName);
  } else if (os.platform() === 'win32') {
    return focusWindows(settings.basedir, browserName);
  } else {
    return Promise.resolve();
  }
};

const setupShutdown = (driver: WebdriverIO.Browser<'async'>, driverApi: DriverLoader.DriverAPI, shutdownDelay = 0): (immediate?: boolean) => Promise<void> => {
  const driverShutdown = async (immediate?: boolean) => {
    try {
      if (immediate) {
        driver.deleteSession();
      } else {
        await driver.pause(shutdownDelay);
        await driver.deleteSession();
      }
    } finally {
      driverApi.stop();
    }
  };

  Shutdown.registerShutdown((code, immediate) => {
    driverShutdown(immediate).finally(() => {
      process.exit(code);
    });
  });

  return driverShutdown;
};

const getPort = async (port: number | undefined, fallbackPort: number): Promise<number> => {
  // If a port has been specified always use it, otherwise find an available port
  if (port !== undefined) {
    return port;
  } else {
    return portfinder.getPortPromise({
      port: fallbackPort,
      stopPort: fallbackPort + 100
    });
  }
};

const driverSetup = async (driver: WebdriverIO.Browser<'async'>, settings: DriverSettings, browserName: string, debuggingPort: number): Promise<void> => {
  // Browsers have a habit of reporting via the webdriver that they're ready before they are (particularly FireFox).
    // setTimeout is a temporary solution, VAN-66 has been logged to investigate properly
    await driver.pause(1500);

    // Log driver details
    logDriverDetails(driver, settings.headless, debuggingPort);

    // Some tests require large windows, so make it as large as it can be.
    // Headless modes can't use maximize, so just set the dimensions to 1280x1024
    if (settings.headless) {
      await driver.setWindowSize(1280, 1024);
    } else {
      await driver.maximizeWindow();
    }
    
    return Promise.resolve();
};

const getFarmUrl = async (): Promise<URL> => {
  console.log('Creating DeviceFarmClient...');
  const client = new DeviceFarmClient({region: 'us-west-2'});
  const input = {
    projectArn: 'arn:aws:devicefarm:us-west-2:103651136441:testgrid-project:79ff2b40-fe26-440f-9539-53163c25442e',
    expiresInSeconds: 5000
  };
  console.log('Sending command to create DF Test Grid URL...');
  const command = new CreateTestGridUrlCommand(input);
  const response = await client.send(command);
  console.log('DF URL expires at:', response.expires);
  return new URL(response.url as string);
};

const createFarm = async (settings: DriverSettings, defaultSettings: WebdriverIO.RemoteOptions): Promise<Driver> => {
  try {
    console.log('setting for driver: ', settings);

    const validBrowsers = ['firefox', 'chrome', 'MicrosoftEdge'];
    if (!validBrowsers.includes(settings.browser)) {
      return Promise.reject('Browser not a valid Device Farm browser');
    }
    const url = await getFarmUrl();

    const options = {
      ...defaultSettings,
      hostname: url.host,
      path: url.pathname,
      protocol: 'https',
      port: 443,
      connectionRetryTimeout: 180000,
      capabilities: {
        browserName: settings.browser,
        'aws:maxDurationSecs': 2400,
      },
    };

    console.log('Starting Webdriver with options:', options);
    const driver = await WebdriverIO.remote(options);
    console.log('Webdriver started.');

    return {
      webdriver: driver,
      shutdown: (_: boolean | undefined) => {
        console.log('Shutting down Device Farm. This currently does nothing.');
        return Promise.resolve();
      }
    };
  } catch (e) {
    // cleanup?
    return Promise.reject(e);
  }
};

/* Settings:
 *
 * browser: the name of the browser
 * basedir: base directory for bedrock
 * webdriverPort: port to use for the webdriver server
 * webdriverTimeout: how long to wait for the webdriver server to start
 */
export const create = async (settings: DriverSettings): Promise<Driver> => {
  const webdriverTimeout = settings.webdriverTimeout || 30000;

  const browserName = browserVariants[settings.browser] || settings.browser;
  
  // Find an open port to start the driver on
  const port = await getPort(settings.webdriverPort, 4444);
  const debuggingPort = settings.headless ? await getPort(settings.debuggingPort, 9000) : 9000;
  const webdriverOptions = getOptions(port, browserName, settings, debuggingPort);

  if (settings.farm) {
    const api = await createFarm(settings, webdriverOptions);
    await driverSetup(api.webdriver, settings, browserName, debuggingPort);
    return api;
  }

  const driverApi = DriverLoader.loadDriver(browserName, settings);

  try {

    if (settings.verbose) {
      console.log(
        `Browser capabilities: ${JSON.stringify(webdriverOptions.capabilities)}`
      );
    }
    
    // Wait for the driver to start up and then start the webdriver session
    await DriverLoader.startAndWaitForAlive(driverApi, port, webdriverTimeout);
    
    const driver = await WebdriverIO.remote(webdriverOptions);

    // IEDriverServer ignores a delete session call if done too quickly so it needs a small delay
    const shutdownDelay = browserName === 'internet explorer' ? 500 : 0;

    // Ensure the driver gets shutdown correctly if shutdown
    // by the user instead of the application
    const driverShutdown = setupShutdown(driver, driverApi, shutdownDelay);

    await driverSetup(driver, settings, browserName, debuggingPort);    
    await focusBrowser(browserName, settings);

    // Return the public driver api
    return {
      webdriver: driver,
      shutdown: driverShutdown
    };
  } catch (e) {
    driverApi.stop();
    return Promise.reject(e);
  }
};
