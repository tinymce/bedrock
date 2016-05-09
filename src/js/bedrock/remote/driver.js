/* Settings:
 *
 * browser: the name of the browser
 */
var create = function (sauceUser, sauceKey, settings) {
  var webdriver = require('selenium-webdriver');
  var chrome = require('selenium-webdriver/chrome');
  var firefox = require('selenium-webdriver/firefox');

  // OS: Mac 10.11, linux, Win7, Win10
  // Browser names: 'microsoftedge', 'chrome', 'safari', 'firefox', 'iexplore'
  // Version: latest

  console.log('settings', settings.browser);

  return new webdriver.Builder()
    .withCapabilities({
      username: sauceUser,
      accessKey: sauceKey,
      browserName: 'chrome',
      platform: 'Win10',
      version: 'latest'
    })
    .usingServer('http://' + sauceUser + ':' + sauceKey + '@ondemand.saucelabs.com:80/wd/hub')
    .build();
};

module.exports = {
  create: create
};