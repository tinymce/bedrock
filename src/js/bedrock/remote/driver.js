/* Settings:
 *
 */
var create = function (sauceUser, sauceKey, settings) {
  var webdriver = require('selenium-webdriver');

  return new webdriver.Builder()
    .withCapabilities(settings)
    .usingServer('http://' + sauceUser + ':' + sauceKey + '@ondemand.saucelabs.com:80/wd/hub')
    .build();
};

module.exports = {
  create: create
};
