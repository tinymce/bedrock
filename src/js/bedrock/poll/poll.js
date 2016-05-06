var loop = function (driver, settings) {
  var state = require('./state');
  var exits = require('./exits');
  var webdriver = require('selenium-webdriver');

  var By = webdriver.By;
  var until = webdriver.until;
  var Condition = webdriver.Condition;

  var currentState = state.init({
    overallTimeout: settings.overallTimeout,
    singleTimeout: settings.singleTimeout,
    testName: settings.testName,
    // done: settings.done,
    progress: settings.progress,
    total: settings.total
  });

  var KEEP_GOING = false;

  var nextTick = function () {
    var tick = new Date().getTime();

    if (currentState.allTimeout(tick)) return exits.allTestsTooLong(currentState, tick);
    else if (currentState.testTimeout(tick)) return exits.oneTestTooLong(currentState, tick);
    else {
      // I want to check if there is something on the page.
      return driver.wait(until.elementLocated(By.css(settings.done)), 1).then(function () {
        return exits.testsDone(settings);
      }, function (err) {
        // We aren't done yet ... so update the current test if necessary.
        return currentState.update(driver, tick).then(function () {
          return KEEP_GOING;
        }, function () {
          return KEEP_GOING;
        });
      });
    }
  };
  
  return driver.wait(nextTick, settings.overallTimeout + 100000).then(function (outcome) {
    return outcome(driver);
  }, function (err) {
    console.log('Unexpected error while running the testing loop: ' +  err);
    return exits.allTestsTooLong(currentState, new Date().getTime())(driver);
  });
};

module.exports = {
  loop: loop
};
