var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var until = webdriver.until;

var oneTestTooLong = function (state, tick) {
  return function (/* driver */) {
    return new Promise(function (resolve, reject) {
      var elapsed = state.singleTimer.diff(tick);
      console.log('Test: ' + state.currentTest() + ' ran too long.');
      reject('Test: ' + state.currentTest() + ' ran too long (' + elapsed + ')');
    });
  };
};

var allTestsTooLong = function (state, tick) {
  return function (/* driver */) {
    return new Promise(function (resolve, reject) {
      var elapsed = state.allTimer.diff(tick);
      console.log('Tests timed out: ' + elapsed + 'ms');
      reject('Tests timed out: ' + elapsed + 'ms');
    });
  };
};

var noResultsSupported = function () {
  console.log('This mode does not support Results data');
  return Promise.resolve(JSON.stringify({
    results: []
  }));
};

var testsDone = function (settings) {
  return function (driver) {
    if (settings.results === null) return noResultsSupported();
    var resultsCss = By.css(settings.results);
    return driver.wait(until.elementLocated(resultsCss), 1000).then(function (res) {
      return res.getInnerHtml();
    }, function (err) {
      console.error('Debugging: tests completed but no area for test results', err);
      return Promise.reject(err);
    });
  };
};

module.exports = {
  oneTestTooLong: oneTestTooLong,
  allTestsTooLong: allTestsTooLong,
  testsDone: testsDone
};
