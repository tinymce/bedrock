/* Settings:
 *
 * browser: the name of the browser
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

  driver.manage().window().maximize();
  return driver;
};

module.exports = {
  create: create
};

