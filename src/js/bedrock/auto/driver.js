var path = require('path');
var child_process = require('child_process');
var os = require('os');

// Makes sure that Edge has proper focus and is the top most window
var focusEdge = function (basedir, callback) {
  var edgeFocusScript = path.join(basedir, 'bin/focus/edge.js');
  child_process.exec('cscript ' + edgeFocusScript, function () {
    callback();
  });
};

var focusMac = function (basedir, browser, callback) {
  var macFocusScript = path.join(basedir, 'bin/focus/mac.applescript');
  child_process.exec(`osascript ${macFocusScript} ${browser}`, function () {
    callback();
  });
};

/* Settings:
 *
 * browser: the name of the browser
 * basedir: base directory for bedrock
 */
var create = function (settings) {
  var webdriver = require('selenium-webdriver');
  // Support for disabling the Automation Chrome Extension
  var chrome = require('selenium-webdriver/chrome');
  var chromeOptions = new chrome.Options();

  chromeOptions.addArguments('chrome.switches', '--disable-extensions');

  var driver = new webdriver.Builder()
    .forBrowser(settings.browser).setChromeOptions(chromeOptions)
    .build();

  return new Promise(function (resolve) {
    // Some tests require large windows, so make it as large as it can be.
    return driver.manage().window().maximize().then(function () {
      if (settings.browser === 'MicrosoftEdge') {
        focusEdge(settings.basedir, function () {
          resolve(driver);
        });
      } else if (os.platform() === 'darwin') {
        focusMac(settings.basedir, settings.browser, function () {
          driver.executeScript('window.focus();').then(function () {
            resolve(driver);
          });
        });
      } else {
        resolve(driver);
      }
    });
  });
};

module.exports = {
  create: create
};

