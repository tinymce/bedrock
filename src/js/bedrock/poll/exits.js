var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var until = webdriver.until;

var oneTestTooLong = function (state, tick) {
  return function (driver) {
  return new Promise(function (resolve, reject) {
    var elapsed = state.singleTimer.diff(tick);
    console.log('Test: ' + state.currentTest() + ' ran too long.');
    reject('Test: ' + state.currentTest() + ' ran too long (' + elapsed + ')');    
  });
  };
};

var allTestsTooLong = function (state, tick) {
  return function (driver) {
  return new Promise(function (resolve, reject) {
    var elapsed = state.allTimer.diff(tick);
    console.log('Tests timed out: ' + elapsed + 'ms');
    reject('Tests timed out: ' + elapsed + 'ms');
  });
  };
};

var hasFailures = function () {
  return new Promise(function (resolve, reject) {
    reject('Some tests failed');
  });
};

var noFailures = function () {
  return new Promise(function (resolve, reject) {
    resolve('');
  });
};

var testsDone = function (settings) {
  return function (driver) {
    var testCss = By.css(settings.failed);
    var result = driver.wait(until.elementLocated(testCss), 1);
    return result.then(hasFailures, noFailures);
  };
};

module.exports = {
  oneTestTooLong: oneTestTooLong,
  allTestsTooLong: allTestsTooLong,
  testsDone: testsDone
};