const webdriver = require('selenium-webdriver');
const By = webdriver.By;

const effectutils = require('./effectutils');

/*
 JSON API for data: {
   type :: String, ("move" || "click" || "down" || "up")
   selector :: String
 }
 */
const getAction = function (driver, target, type) {
  if (type === 'move') return driver.actions().mouseMove(target).perform();
  else if (type === 'down') return driver.actions().mouseMove(target).mouseDown().perform();
  else if (type === 'up') return driver.actions().mouseMove(target).mouseUp().perform();
  // MicrosoftEdge does support this, but does not seem to support click in an ActionSequence
  else if (type === 'click') return target.click();
  else return new Promise.reject('Unknown mouse effect type: ' + type);
};

const execute = function (driver, data) {
  return effectutils.getTarget(driver, data).then(function (tgt) {
    return getAction(driver, tgt, data.type).then(function (res) {
      return driver.switchTo().defaultContent().then(function () {
        return res;
      });
    }, function (err) {
      return driver.switchTo().defaultContent().then(function () {
        return Promise.reject(err);
      });
    });
  });
};

const executor = function (driver) {
  return function (data) {
    return execute(driver, data);
  };
};

module.exports = {
  executor: executor
};
