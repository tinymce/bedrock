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

var testsDone = function (settings) {
  return function (driver) {
    var testCss = By.css(settings.failed);
    var resultsCss = By.css(settings.results);
    return driver.wait(until.elementLocated(resultsCss), 1).then(function (res) {
      return res.getInnerHtml();
    });
  };
};

module.exports = {
  oneTestTooLong: oneTestTooLong,
  allTestsTooLong: allTestsTooLong,
  testsDone: testsDone
};


// {
//   "results":
//   [
//     {"name":"RunOperationTest","file":"project/src/test/js/browser/projects/newt/RunOperationTest.js","passed":true,"time":"0.084s"}
//   ],
//   "time":"6.6759s"
// }