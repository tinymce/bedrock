var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var until = webdriver.until;

var oneTestTooLong = function (testName, timer, tick) {
  return function (driver) {
  return new Promise(function (resolve, reject) {
    var elapsed = timer.diff(tick);
    console.log('Test: ' + testName + ' ran too long.');
    reject('Test: ' + testName + ' ran too long (' + elapsed + ')');    
  });
  };
};

var allTestsTooLong = function (timer, tick) {
  return function (driver) {
  return new Promise(function (resolve, reject) {
    var elapsed = timer.diff(tick);
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

var testsDone = function () {
  return function (driver) {
    var testCss = By.css('.test.failed');
    var result = driver.wait(until.elementLocated(testCss), 1);
    return result.then(hasFailures, noFailures);
  };
};

module.exports = {
  oneTestTooLong: oneTestTooLong,
  allTestsTooLong: allTestsTooLong,
  testsDone: testsDone
};