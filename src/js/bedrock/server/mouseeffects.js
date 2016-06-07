var webdriver = require('selenium-webdriver');
var By = webdriver.By;

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
  var target = driver.findElement(By.css(data.selector));
  return getAction(driver, target, data.type).perform();
};

var executor = function (driver) {
  return function (data) {
    return execute(driver, data);
  };
};

module.exports = {
  executor: executor
};