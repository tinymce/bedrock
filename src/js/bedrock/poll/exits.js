var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var until = webdriver.until;

var formatTime = function (time) {
  return (time / 1000) + 's';
};

var oneTestTooLong = function (state, tick) {
  return function (/* driver */) {
    return new Promise(function (resolve, reject) {
      var elapsed = formatTime(state.singleTimer.diff(tick));
      var message = 'Test: ' + state.currentTest() + ' ran too long (' + elapsed + '). Limit for an individual test is set to: ' + formatTime(state.singleTimer.getLimit());
      reject({
        results: [
          { file: state.currentTest(), name: state.currentTest(), time: elapsed, error: message }
        ],
        time: formatTime(state.allTimer.diff(tick)),
        message: message
      });
    });
  };
};

var allTestsTooLong = function (state, tick) {
  return function (/* driver */) {
    return new Promise(function (resolve, reject) {
      var message = 'Tests timed out: ' + elapsed + 'ms. Limit is set to ' + formatTime(state.allTimer.getLimit());
      var elapsed = formatTime(state.allTimer.diff(tick));
      reject({
        results: [
          { file: 'Last test: ' + state.currentTest(), name: 'all', time: elapsed, error: message }
        ],
        time: elapsed,
        message: message
      });
    });
  };
};

var getText = function (res) {
  return res.getAttribute('value').then(function (text) {
    return text ? text : res.getText();
  });
};

var testsDone = function (state, tick, settings) {
  return function (driver) {
    var resultsCss = By.css(settings.results);
    return driver.wait(until.elementLocated(resultsCss), 1).then(function (res) {
      return getText(res);
    }, function (err) {
      var elapsed = formatTime(state.allTimer.diff(tick));
      console.error('Debugging: tests completed but no area for test results', err);
      return Promise.reject({
        results: [
          { file: 'MissingTestInformation', name: 'MissingTestInformation', time: elapsed, error: err }
        ],
        time: elapsed,
        message: err
      });
    });
  };
};

module.exports = {
  oneTestTooLong: oneTestTooLong,
  allTestsTooLong: allTestsTooLong,
  testsDone: testsDone
};
