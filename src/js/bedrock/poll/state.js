
var timeouts = require('./timeouts');
var scrape = require('./scrape');
var attempt = require('../core/attempt');

var init = function (settings) {
  var startTime = new Date().getTime();

  var overallTimer = timeouts.timeoutExit(settings.overallTimeout, startTime);
  var singleTimer = timeouts.timeoutExit(settings.singleTimeout, startTime);

  var testData = {
    progress: 0,
    testName: '(not set)'
  };

  var allTimeout = function (tick) {
    return overallTimer.hasExpired(tick);
  };

  var testTimeout = function (tick) {
    return singleTimer.hasExpired(tick);
  };

  var currentTest = function () {
    return testData.testName;
  };

  var update = function (driver, tick) {
    var scraped = scrape.scrape(driver, {
      progress: settings.progress,
      testName: settings.testName
    });

    // NOTE: The return value of update is ignore anyway.
    return scraped.then(function (dataAttempt) {
      return attempt.cata(
        dataAttempt,
        function (err) {
          console.error('Error scraping test screen');
          console.error(err);
          return Promise.reject(err);
        },
        function (data) {
          // Check if test number has changed. If it has, reset the single test timer.
          if (testData.progress !== data.progress) {
            singleTimer.reset(tick);
          }

          testData = data;
          return Promise.resolve(testData);
        }
      );
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
