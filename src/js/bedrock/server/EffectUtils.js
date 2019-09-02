const webdriver = require('selenium-webdriver');
const until = require('selenium-webdriver/lib/until');

const By = webdriver.By;

const getTargetFromFrame = function (driver, selector) {
  const sections = selector.split('=>');
  const frameSelector = sections[0];
  const targetSelector = sections[1];
  return driver.findElement(By.css(frameSelector)).then(function (frame) {
    return driver.wait(until.ableToSwitchToFrame(frame), 100).then(function (f) {
      return driver.findElement(By.css(targetSelector)).then(function (target) {
        return driver.wait(until.elementIsVisible(target), 100);
      });
    });
  });
};

const getTargetFromMain = function (driver, selector) {
  return driver.findElement(By.css(selector));
};

const getTarget = function (driver, data) {
  const selector = data.selector;
  const getter = selector.indexOf('=>') > -1 ? getTargetFromFrame : getTargetFromMain;
  return getter(driver, selector);
};

module.exports = {
  getTarget: getTarget
};
