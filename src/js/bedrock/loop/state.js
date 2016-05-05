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

  var update = function (driver, tick) {
    // Firstly, let's see if the test number has changed.
    return driver.wait(until.elementLocated(By.css(settings.progress)), 1).getInnerHtml().then(function (html) {
      var num = parseInt(html, 10);
      if (lastTest !== num) {
        singleTimer.reset(tick);
        lastTest = num;
      }

      // Now, let's update the test name if we can.
      return driver.wait(until.elementLocated(By.css(settings.testName)), 1).getInnerHtml().then(function (html) {
        testName = html;
        return testName;
      });
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