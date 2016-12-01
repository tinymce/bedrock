var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var until = webdriver.until;

var attempt = require('../core/attempt');

var parseHtml = function (driver, selector) {
  return driver.wait(until.elementLocated(By.css(selector)), 1).then(function (elem) {
    return elem.getAttribute('innerHTML');
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