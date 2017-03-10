var path = require('path');
var child_process = require('child_process');
var os = require('os');

var webdriver = require('selenium-webdriver');

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
var addPhantomCapabilities = function (blueprints) {
  var prefs = new webdriver.logging.Preferences();
  prefs.setLevel(webdriver.logging.Type.DRIVER, webdriver.logging.Level.WARNING);
  
  var caps = webdriver.Capabilities.phantomjs();
  caps.setLoggingPrefs(prefs);

  return blueprints.withCapabilities(caps);
};

/* Settings:
 *
 * browser: the name of the browser
 * basedir: base directory for bedrock
 */
var create = function (settings) {
  var driverDep = browserDrivers[settings.browser];
  if (driverDep === undefined) console.log('Not loading a driver for browser ' + settings.browser);
  else {
    try {
      require(driverDep);
    } catch (e) {
      console.log(`No local ${driverDep} for ${settings.browser}. Searching system path...`);
    }
  }

  // Support for disabling the Automation Chrome Extension
  var chrome = require('selenium-webdriver/chrome');
  var chromeOptions = new chrome.Options();

  chromeOptions.addArguments('chrome.switches', '--disable-extensions');

  var rawBlueprints = new webdriver.Builder()
    .forBrowser(settings.browser).setChromeOptions(chromeOptions);

  var blueprint = settings.browser === 'phantomjs' ? addPhantomCapabilities(rawBlueprints) : rawBlueprints;

  var driver = blueprint.build();
    
  // Andy made some attempt to catch errors in this code but it never worked, I suspect the webdriver implementation
  // of promise is broken. Node gives 'unhandled rejection' errors no matter where I put the rejection handlers.
  return new Promise(function (resolve) {
    // Browsers have a habit of reporting via the webdriver that they're ready before they are (particularly FireFox).
    // setTimeout is a temporary solution, VAN-66 has been logged to investigate properly
    setTimeout(function () {
      // Some tests require large windows, so make it as large as it can be.
      return driver.manage().window().maximize().then(function () {
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

