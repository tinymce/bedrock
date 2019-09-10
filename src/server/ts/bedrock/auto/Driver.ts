import * as path from 'path';
import * as childProcess from 'child_process';
import * as os from 'os';
import * as webdriver from 'webdriverio';
import * as portfinder from 'portfinder';
import * as Shutdown from '../util/Shutdown';
import * as DriverLoader from './DriverLoader';

const browserVariants = {
  'chrome-headless': 'chrome',
  'firefox-headless': 'firefox',
  'ie': 'internet explorer'
};

const cscriptFocus = function (basedir, script) {
  return new Promise(function (resolve) {
    const focusScript = path.join(basedir, 'bin/focus/' + script);
    childProcess.exec('cscript ' + focusScript, function () {
      resolve();
    });
  });
};

// Mac doesn't focus windows opened through automation, so use AppleScript to do it for us
const focusMac = function (basedir, browser) {
  if (browser === 'phantomjs') {
    return Promise.resolve();
  } else {
    return new Promise(function (resolve) {
      const macFocusScript = path.join(basedir, 'bin/focus/mac.applescript');
      childProcess.exec(`osascript ${macFocusScript} ${browser}`, function () {
        resolve();
      });
    });
  }
};

const focusWindows = function (basedir, browser) {
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

const addArguments = function (capabilities, name, args) {
  if (!capabilities.hasOwnProperty(name)) {
    capabilities[name] = { args: [] };
  }
  const currentArgs = capabilities[name].args || [];
  capabilities[name].args = currentArgs.concat(args);
};

const getOptions = function (port, browserName, browserFamily, settings): WebdriverIO.RemoteOptions {
  const options = {
    path: '/',
    port: port,
    logLevel: 'silent' as 'silent',
    capabilities: {
      browserName: browserFamily
    }
  };

  // Support for disabling the Automation Chrome Extension
  // https://stackoverflow.com/questions/43261516/selenium-chrome-i-just-cant-use-driver-maximize-window-to-maximize-window
  const caps = options.capabilities;
  if (browserFamily === 'chrome') {
    addArguments(caps, 'goog:chromeOptions', ['--start-maximized', '--disable-extensions']);
  }

  // Setup any headless mode options
  if (browserName === 'phantomjs') {
    caps['phantomjs.cli.args'] = '--remote-debugger-port=' + settings.debuggingPort;
  } else if (browserName === 'firefox-headless') {
    // https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Headless_mode#Debugging_headless_Firefox
    addArguments(caps, 'moz:firefoxOptions', ['-headless', '-start-debugger-server=' + settings.debuggingPort]);
    caps['moz:firefoxOptions'].prefs = {
      'devtools.debugger.remote-enabled': true,
      'devtools.debugger.prompt-connection': false,
      'devtools.chrome.enabled': true
    }
  } else if (browserName === 'chrome-headless') {
    addArguments(caps, 'goog:chromeOptions', ['--headless', '--remote-debugging-port=' + settings.debuggingPort]);
    if (settings.useSandboxForHeadless) {
      addArguments(caps, 'goog:chromeOptions', [ '--no-sandbox' ]);
    }
  }

  return options;
};

const logDriverDetails = function (driver) {
  const caps = driver.capabilities;
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
  }
};

const focusBrowser = function (browserName, settings) {
  if (os.platform() === 'darwin') {
    return focusMac(settings.basedir, browserName);
  } else if (os.platform() === 'win32') {
    return focusWindows(settings.basedir, browserName);
  } else {
    return Promise.resolve();
  }
};

const setupShutdown = function (driver: WebdriverIOAsync.BrowserObject, driverApi: DriverLoader.DriverAPI) {
  const driverShutdown = function (immediate?: boolean) {
    if (immediate) {
      driver.deleteSession();
      driverApi.stop();
      return Promise.resolve();
    } else {
      return driver.deleteSession().then(driverApi.stop).catch(driverApi.stop);
    }
  };

  Shutdown.registerShutdown(function (code, immediate) {
    driverShutdown(immediate).then(function () {
      process.exit(code);
    });
  });

  return driverShutdown;
};

/* Settings:
 *
 * browser: the name of the browser
 * basedir: base directory for bedrock
 * webdriverPort: port to use for the webdriver server
 * webdriverTimeout: how long to wait for the webdriver server to start
 */
export const create = function (settings) {
  const webdriverPort = settings.webdriverPort || 4444;
  const webdriverTimeout = settings.webdriverTimeout || 30000;

  const browserName = settings.browser;
  const browserFamily = browserVariants[browserName] || browserName;

  const driverApi = DriverLoader.loadDriver(browserFamily);

  // Find an open port to start the driver on
  return portfinder.getPortPromise({
    port: webdriverPort,
    stopPort: webdriverPort + 100
  }).then(function (port) {
    // Wait for the driver to start up and then start the webdriver session
    return DriverLoader.startAndWaitForAlive(driverApi, port, webdriverTimeout).then(function () {
      const webdriverOptions = getOptions(port, browserName, browserFamily, settings);
      return webdriver.remote(webdriverOptions);
    }).then(function (driver) {
      // Ensure the driver gets shutdown correctly if shutdown
      // by the user instead of the application
      const driverShutdown = setupShutdown(driver, driverApi);

      // Browsers have a habit of reporting via the webdriver that they're ready before they are (particularly FireFox).
      // setTimeout is a temporary solution, VAN-66 has been logged to investigate properly
      return driver.pause(1500).then(function () {
        // Log driver details
        logDriverDetails(driver);

        // Some tests require large windows, so make it as large as it can be.
        // Headless modes can't use maximize, so just set the dimensions to 1280x1024
        if (browserName === 'chrome-headless' || browserName === 'firefox-headless') {
          return driver.setWindowSize(1280, 1024) as any;
        } else {
          return driver.maximizeWindow();
        }
      }).then(function () {
        return focusBrowser(browserFamily, settings);
      }).then(function () {
        // Return the public driver api
        return {
          webdriver: driver,
          shutdown: driverShutdown
        };
      });
    });
  }).catch(function (e) {
    driverApi.stop();
    return Promise.reject(e);
  });
};
