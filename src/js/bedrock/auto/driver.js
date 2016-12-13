var path = require('path');
var child_process = require('child_process');
var os = require('os');

var browserDrivers = {
  'chrome': 'chromedriver',
  'firefox': 'geckodriver',
  'internet explorer': 'iedriver',
  'MicrosoftEdge': 'edgedriver'
};

// Makes sure that Edge has proper focus and is the top most window
var focusEdge = function (basedir) {
  return new Promise(function (resolve) {
    var edgeFocusScript = path.join(basedir, 'bin/focus/edge.js');
    child_process.exec('cscript ' + edgeFocusScript, function () {
      resolve();
    });
  });
};

var focusMac = function (basedir, browser) {
  return new Promise(function (resolve) {
    var macFocusScript = path.join(basedir, 'bin/focus/mac.applescript');
    child_process.exec(`osascript ${macFocusScript} ${browser}`, function () {
      resolve();
    });
  });
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

  var webdriver = require('selenium-webdriver');
  // Support for disabling the Automation Chrome Extension
  var chrome = require('selenium-webdriver/chrome');
  var chromeOptions = new chrome.Options();

  chromeOptions.addArguments('chrome.switches', '--disable-extensions');

  var driver = new webdriver.Builder()
    .forBrowser(settings.browser).setChromeOptions(chromeOptions)
    .build();

  return new Promise(function (resolve) {
    // Browsers have a habit of reporting via the webdriver that they're ready before they are (particularly FireFox).
    // setTimeout is a temporary solution, VAN-66 has been logged to investigate properly
    setTimeout(function () {
      // Some tests require large windows, so make it as large as it can be.
      return driver.manage().window().maximize().then(function () {
        var focus = settings.browser === 'MicrosoftEdge' ? focusEdge(settings.basedir)
                  : os.platform() === 'darwin' ? focusMac(settings.basedir, settings.browser)
                  : Promise.resolve();

        focus.then(function () {
          driver.executeScript('window.focus();').then(function () {
            resolve(driver);
          });
        });
      });
    }, 1500);
  });
};

module.exports = {
  create: create
};

