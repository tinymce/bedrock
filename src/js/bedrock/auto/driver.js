/* Settings:
 *
 * browser: the name of the browser
 */
var create = function (settings) {
  var webdriver = require('selenium-webdriver');
  var chrome = require('selenium-webdriver/chrome');
  var firefox = require('selenium-webdriver/firefox');

  return new webdriver.Builder()
    .forBrowser(settings.browser)
    .setChromeOptions(/* ... */)
    .setFirefoxOptions(/* ... */)
    .build();
};

module.exports = {
  create: create
};

