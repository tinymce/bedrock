const path = require('path');
const child_process = require('child_process');
const os = require('os');
const webdriver = require('selenium-webdriver');

const browserVariants = {
  'chrome-headless': 'chrome',
  'firefox-headless': 'firefox'
};

const browserDrivers = {
  'chrome': 'chromedriver',
  'firefox': 'geckodriver',
  'internet explorer': 'iedriver',
  'MicrosoftEdge': 'edgedriver'
};

const cscriptFocus = function (basedir, script) {
  return new Promise(function (resolve) {
    const focusScript = path.join(basedir, 'bin/focus/' + script);
    child_process.exec('cscript ' + focusScript, function () {
      resolve();
    });
  });
};

// Makes sure that Edge has proper focus and is the top most window
const focusEdge = function (basedir) {
  return cscriptFocus(basedir, 'edge.js');
};

// Mac doesn't focus windows opened through automation, so use AppleScript to do it for us
const focusMac = function (basedir, browser) {
  return new Promise(function (resolve) {
    const macFocusScript = path.join(basedir, 'bin/focus/mac.applescript');
    child_process.exec(`osascript ${macFocusScript} ${browser}`, function () {
      resolve();
    });
  });
};

// Firefox insists on having focus in the address bar, and while F6 will focus the body
// mozilla haven't implemented browser-wide sendkeys in their webdriver
const focusFirefox = function (basedir) {
  // mac F6 is handled in the applescript, we haven't looked at linux FF yet so it's just windows for now
  if (os.platform() === 'win32') return cscriptFocus(basedir, 'winff.js');
  else return Promise.resolve();
};

const getWinVersion = function () {
  if (os.platform() === 'win32') {
    const release = os.release().split('.');
    return {
      major: parseInt(release[0]),
      minor: parseInt(release[1]),
      build: parseInt(release[2])
    };
  } else {
    throw new Error('Unable to determine windows version');
  }
};

// Sets logging level to WARNING instead of the verbose default for phantomjs.
const addPhantomCapabilities = function (blueprints, settings) {
  const prefs = new webdriver.logging.Preferences();
  prefs.setLevel(webdriver.logging.Type.DRIVER, webdriver.logging.Level.WARNING);

  const caps = webdriver.Capabilities.phantomjs();
  caps.setLoggingPrefs(prefs);
  caps.set('phantomjs.cli.args', '--remote-debugger-port=' + settings.debuggingPort);
  return blueprints.withCapabilities(caps);
};

const setupHeadlessModes = function (settings, browser, chromeOptions) {
  if (browser === 'firefox-headless') {
    process.env.MOZ_HEADLESS = '1';
  } else if (browser === 'chrome-headless') {
    chromeOptions.addArguments('headless');
    chromeOptions.addArguments('remote-debugging-port=' + settings.debuggingPort);
    if (settings.useSandboxForHeadless) {
      chromeOptions.addArguments('no-sandbox');
    }
  }
};

const logBrowserDetails = function (driver) {
  return function () {
    return driver.getCapabilities().then((caps) => {
      const browser = caps.get('browserName');

      if (browser === 'chrome') {
        console.log('browser:', caps.get('version'), 'driver:', caps.get('chrome').chromedriverVersion);
      } else if (browser === 'firefox') {
        console.log('browser:', caps.get('browserVersion'));
      } else if (browser === 'phantomjs') {
        console.log('browser:', caps.get('version'), 'driver:', caps.get('driverVersion'));
      } else if (browser === 'MicrosoftEdge') {
        console.log('browser:', caps.get('browserVersion'));
      }
    });
  };
};

/* Settings:
 *
 * browser: the name of the browser
 * basedir: base directory for bedrock
 */
const create = function (settings) {
  const browser = settings.browser;
  const browserFamily = browserVariants.hasOwnProperty(browser) ? browserVariants[browser] : browser;
  const driverDep = browserDrivers[browserFamily];
  if (driverDep === undefined) console.log('Not loading a driver for browser ' + browser);
  else {
    try {
      require(driverDep);
    } catch (e) {
      console.log(`No local ${driverDep} for ${browser}. Searching system path...`);
    }
  }

  /* Add additional logging
   * var logging = webdriver.logging;
   * logging.installConsoleHandler();
   * logging.getLogger('promise.ControlFlow').setLevel(logging.Level.ALL);
   */

  // Support for disabling the Automation Chrome Extension
  const chrome = require('selenium-webdriver/chrome');
  const chromeOptions = new chrome.Options();
  chromeOptions.addArguments('chrome.switches', '--disable-extensions');

  // https://stackoverflow.com/questions/43261516/selenium-chrome-i-just-cant-use-driver-maximize-window-to-maximize-window
  chromeOptions.addArguments('start-maximized');

  // As of Windows build 1809 the edge driver starts in W3C mode instead of JSON Wire Protocol, so we need to start the driver with the '--jwp' flag
  // https://github.com/SeleniumHQ/selenium/issues/6464
  if (os.platform() === 'win32' && browser === 'MicrosoftEdge') {
    const winVersion = getWinVersion();
    // The "--jwp" argument doesn't exist in older versions of `MicrosoftWebDriver` so we need to detect the windows version
    if (winVersion.major > 10 || winVersion.major === 10 && winVersion.build >= 17763) {
      const edge = require('selenium-webdriver/edge');
      const edgeService = new edge.ServiceBuilder().addArguments('--jwp').build();
      edge.setDefaultService(edgeService);
    }
  }

  const rawBlueprints = new webdriver.Builder()
    .forBrowser(browserFamily).setChromeOptions(chromeOptions);

  const blueprint = browser === 'phantomjs' ? addPhantomCapabilities(rawBlueprints, settings) : rawBlueprints;

  const driver = blueprint.build();

  setupHeadlessModes(settings, browser, chromeOptions);

  const setSize = function () {
    /* If maximize does not work on your system (esp. firefox hangs), hard-code the size (like so) */
    // return driver.manage().window().setSize(800, 600);
    return driver.manage().window().maximize();
  };

  const resume = function () {
    return Promise.resolve(driver);
  };

  // Andy made some attempt to catch errors in this code but it never worked, I suspect the webdriver implementation
  // of promise is broken. Node gives 'unhandled rejection' errors no matter where I put the rejection handlers.
  return new Promise(function (resolve) {
    // Browsers have a habit of reporting via the webdriver that they're ready before they are (particularly FireFox).
    // setTimeout is a temporary solution, VAN-66 has been logged to investigate properly
    setTimeout(function () {
      // Some tests require large windows, so make it as large as it can be.
      return setSize().then(resume, resume).then(function () {
        const systemFocus = os.platform() === 'darwin' && browser !== 'phantomjs' ? focusMac(settings.basedir, browser) : Promise.resolve();

        const browserFocus = browser === 'MicrosoftEdge' ? focusEdge(settings.basedir) :
          browser === 'firefox' ? focusFirefox(settings.basedir) :
            Promise.resolve();

        systemFocus
          .then(browserFocus)
          .then(logBrowserDetails(driver))
          .then(function () {
            resolve(driver);
          });
      });
    }, 1500);
  });
};

module.exports = {
  create: create
};

