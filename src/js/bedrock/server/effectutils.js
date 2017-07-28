var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var until = require('selenium-webdriver/lib/until');

var getTargetFromFrame = function (driver, selector) {
  var sections = selector.split('=>');
  var frameSelector = sections[0];
  var targetSelector = sections[1];
  console.log('targetSelector', targetSelector);
  return driver.findElement(By.css(frameSelector)).then(function (frame) {
    return driver.wait(until.ableToSwitchToFrame(frame), 100).then(function (f) {

      // return driver.switchTo().frame(f).then(function (_) {
        return driver.findElement(By.css(targetSelector)).then(function (target) {
          return driver.wait(until.elementIsVisible(target), 100);
        });

      // });
    });
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