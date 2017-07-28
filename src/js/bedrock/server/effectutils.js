var webdriver = require('selenium-webdriver');
var By = webdriver.By;

var getTargetFromFrame = function (driver, selector) {
  var sections = selector.split('=>');
  var frameSelector = sections[0];
  var targetSelector = sections[1];
  return driver.findElement(By.css(frameSelector)).then(function (frame) {
    driver.switchTo().frame(frame);
    return driver.findElement(By.css(targetSelector));
  });
};

var getTargetFromMain = function (driver, selector) {
  return driver.findElement(By.css(selector));
};

var getTarget = function (driver, data) {
  var selector = data.selector;
  var getter = selector.indexOf('=>') > -1 ? getTargetFromFrame : getTargetFromMain;
  return getter(driver, selector);
};

module.exports = {
  getTarget: getTarget
};