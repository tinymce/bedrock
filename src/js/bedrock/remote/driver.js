/* Settings:
 *
 * browser: the name of the browser
 * os: the name of the operating system
 * browserVersion: the version of the browser
 */
var create = function (sauceUser, sauceKey, settings) {
  var webdriver = require('selenium-webdriver');

  return new webdriver.Builder()
    .withCapabilities({
      username: sauceUser,
      accessKey: sauceKey,
      browserName: settings.browser,
      platform: settings.os,
      version: 'latest'
    })
    .usingServer('http://' + sauceUser + ':' + sauceKey + '@ondemand.saucelabs.com:80/wd/hub')
    .build();
};

module.exports = {
  create: create
};