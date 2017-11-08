var path = require('path');
var child_process = require('child_process');
var os = require('os');
var webdriver = require('selenium-webdriver');

var webdriver = require('selenium-webdriver');

var headlessModes = {
  'chrome-headless': 'chrome',
  'firefox-headless': 'firefox'
};

var browserDrivers = {
  'chrome': 'chromedriver',
  'firefox': 'geckodriver',
  'internet explorer': 'iedriver',
  'MicrosoftEdge': 'edgedriver'
};

var cscriptFocus = function (basedir, script) {
  return new Promise(function (resolve) {
    var focusScript = path.join(basedir, 'bin/focus/' + script);
    child_process.exec('cscript ' + focusScript, function () {
      resolve();
    });
  });
};

// Makes sure that Edge has proper focus and is the top most window
var focusEdge = function (basedir) {
  return cscriptFocus(basedir, 'edge.js');
};

// Mac doesn't focus windows opened through automation, so use AppleScript to do it for us
var focusMac = function (basedir, browser) {
  return new Promise(function (resolve) {
    var macFocusScript = path.join(basedir, 'bin/focus/mac.applescript');
    child_process.exec(`osascript ${macFocusScript} ${browser}`, function () {
      resolve();
    });
  });
};

// Firefox insists on having focus in the address bar, and while F6 will focus the body
// mozilla haven't implemented browser-wide sendkeys in their webdriver
var focusFirefox = function (basedir) {
  // mac F6 is handled in the applescript, we haven't looked at linux FF yet so it's just windows for now
  if (os.platform() === 'win32') return cscriptFocus(basedir, 'winff.js');
  else return Promise.resolve();
};

// Sets logging level to WARNING instead of the verbose default for phantomjs. 
var addPhantomCapabilities = function (blueprints, settings) {
  var prefs = new webdriver.logging.Preferences();
  prefs.setLevel(webdriver.logging.Type.DRIVER, webdriver.logging.Level.WARNING);
  
  var caps = webdriver.Capabilities.phantomjs();
  caps.setLoggingPrefs(prefs);
  caps.set('phantomjs.cli.args', '--remote-debugger-port=' + settings.debuggingPort);
  return blueprints.withCapabilities(caps);
};

/* Settings:
 *
 * browser: the name of the browser
 * basedir: base directory for bedrock
 */
var create = function (settings) {
  var browserName = headlessModes.hasOwnProperty(settings.browser) ? headlessModes[settings.browser] : settings.browser;
  var driverDep = browserDrivers[browserName];
  if (driverDep === undefined) console.log('Not loading a driver for browser ' + settings.browser);
  else {
    try {
      require(driverDep);
    } catch (e) {
      console.log(`No local ${driverDep} for ${settings.browser}. Searching system path...`);
    }
  }

  /* Add additional logging
   * var logging = webdriver.logging;
   * logging.installConsoleHandler();
   * logging.getLogger('promise.ControlFlow').setLevel(logging.Level.ALL);
   */

  // Support for disabling the Automation Chrome Extension
  var chrome = require('selenium-webdriver/chrome');
  var chromeOptions = new chrome.Options();
  chromeOptions.addArguments('chrome.switches', '--disable-extensions');
  
  // https://stackoverflow.com/questions/43261516/selenium-chrome-i-just-cant-use-driver-maximize-window-to-maximize-window
  chromeOptions.addArguments('start-maximized');

  var rawBlueprints = new webdriver.Builder()
    .forBrowser(browserName).setChromeOptions(chromeOptions);

  var blueprint = settings.browser === 'phantomjs' ? addPhantomCapabilities(rawBlueprints, settings) : rawBlueprints;

  var driver = blueprint.build();

  var setSize = function () {
    /* If maximize does not work on your system (esp. firefox), hard-code the size */
    // return driver.manage().window().setSize(800, 600);
    return driver.manage().window().maximize();
  };

  var resume = function () {
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
        var systemFocus = os.platform() === 'darwin' && settings.browser !== 'phantomjs' ? focusMac(settings.basedir, settings.browser) : Promise.resolve();

        var browserFocus = settings.browser === 'MicrosoftEdge' ? focusEdge(settings.basedir) :
                          settings.browser === 'firefox' ? focusFirefox(settings.basedir) :
                          Promise.resolve();

        systemFocus.then(browserFocus).then(function () {
          resolve(driver);
        });
      });
    }, 1500);
  });
};

module.exports = {
  create: create
};

