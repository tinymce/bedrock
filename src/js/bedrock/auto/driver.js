/* Settings:
 *
 * browser: the name of the browser
 */
var create = function (settings) {
  var webdriver = require('selenium-webdriver');

  return new webdriver.Builder()
    .forBrowser(settings.browser)
    .build();
};

module.exports = {
  create: create
};

