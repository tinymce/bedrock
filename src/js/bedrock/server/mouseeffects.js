var webdriver = require('selenium-webdriver');
var By = webdriver.By;

var effectutils = require('./effectutils');

/*
 JSON API for data: {
   type :: String, ("move" || "click" || "down" || "up")
   selector :: String
 }
 */
var getAction = function (driver, target, type) {
  if (type === 'move') return driver.actions().mouseMove(target);
  else if (type === 'down') return driver.actions().mouseMove(target).mouseDown();
  else if (type === 'up') return driver.actions().mouseMove(target).mouseUp();
  else if (type === 'click') return driver.actions().mouseMove(target).click();
  else return new Promise.reject('Unknown mouse effect type: ' + type);
};

var execute = function (driver, data) {
  return effectutils.getTarget(driver, data).then(function (tgt) {
    return getAction(driver, tgt, data.type).perform().then(function (res) {
      driver.switchTo().defaultContent();
      return res;
    });
  });
};

var executor = function (driver) {
  return function (data) {
    return execute(driver, data);
  };
};

module.exports = {
  executor: executor
};