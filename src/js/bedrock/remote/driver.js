/* Settings:
 *
 * browser: the name of the browser
 */
var create = function (sauceUser, sauceKey, settings) {
  var webdriver = require('selenium-webdriver');
  var chrome = require('selenium-webdriver/chrome');
  var firefox = require('selenium-webdriver/firefox');

  console.log('settings', settings.browser);

  return new webdriver.Builder()
    .withCapabilities({
      username: sauceUser,
      accessKey: sauceKey,
      browserName: 'chrome',
      platform: 'Windows 10',
      version: '43.0'
    })
    .usingServer('http://' + sauceUser + ':' + sauceKey + '@ondemand.saucelabs.com:80/wd/hub')
    .build();
};

module.exports = {
  create: create
};