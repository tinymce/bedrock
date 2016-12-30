var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var until = webdriver.until;

var attempt = require('../core/attempt');

var parseHtml = function (driver, selector) {
  return driver.wait(until.elementLocated(By.css(selector)), 1000).then(function (elem) {
    /*
     * History
     *
     * elem.getInnerHtml() => was deprecated as of selenium webdriver 3.0
     * elem.getAttribute('innerHTML') returns null on Firefox
     * elem.getText() seems to work on all browsers
     *
     * use "test/acceptance/scraping-test" to check if browsers are compatible with this scraping mode
     */
    return elem.getText();
  });
};

// ASSUMPTION: progress and test name should always be found together.
var scrape = function (driver, settings) {
  return parseHtml(driver, settings.progress).then(function (progressHtml) {
    var progress = parseInt(progressHtml, 10);
    return parseHtml(driver, settings.testName).then(function (testName) {
      return attempt.passed({
        testName: testName,
        progress: progress
      });
    });
  }, function (err) {
    return attempt.failed(err);
  });
};

module.exports = {
  scrape: scrape
};