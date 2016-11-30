var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var until = webdriver.until;

var timeouts = require('./timeouts');

var init = function (settings) {
  var startTime = new Date().getTime();

  var overallTimer = timeouts.timeoutExit(settings.overallTimeout, startTime);
  var singleTimer = timeouts.timeoutExit(settings.singleTimeout, startTime);

  var lastTest = 0;
  var testName = '(not set)';

  var allTimeout = function (tick) {
    return overallTimer.hasExpired(tick);
  };

  var testTimeout = function (tick) {
    return singleTimer.hasExpired(tick);
  };

  var currentTest = function () {
    return testName;
  };

  var parseHtml = function (driver, selector) {
    return driver.wait(until.elementLocated(By.css(selector)), 1).then(function (elem) {
      return elem.getAttribute('innerHTML');
    });
  };

  var update = function (driver, tick) {
    // Firstly, let's see if the test number has changed.
    return parseHtml(driver, settings.progress).then(function (html) {
      var num = parseInt(html, 10);
      if (lastTest !== num) {
        singleTimer.reset(tick);
        lastTest = num;
      }

      // Now, let's update the test name if we can.
      return parseHtml(driver, settings.testName).then(function (html) {
        testName = html;
        return testName;
      }, function (err) {
        console.error('Error trying to read test name');
        console.error(err);
      });
    }, function (err) {
      console.error('Error trying to read test progress');
      console.error(err);
    });
  };

  return {
    allTimeout: allTimeout,
    testTimeout: testTimeout,
    currentTest: currentTest,
    allTimer: overallTimer,
    singleTimer: singleTimer,
    update: update
  };
};

module.exports = {
  init: init
};
