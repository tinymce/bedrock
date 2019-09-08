const frameSelected = function (driver, frame) {
  return function () {
    return driver.switchToFrame(frame).then(function () {
      return true;
    }).catch(function (e) {
      if (!(e.name && e.name === 'no such frame')) {
        throw e;
      }
      return false;
    });
  }
};

const getTargetFromFrame = function (driver, selector) {
  const sections = selector.split('=>');
  const frameSelector = sections[0];
  const targetSelector = sections[1];
  // Note: Don't use driver.$() here as it doesn't work on Edge
  return driver.findElement('css selector', frameSelector).then(function (frame) {
    return driver.waitUntil(frameSelected(driver, frame), 100).then(function () {
      return driver.$(targetSelector).then(function (target) {
        return target.waitForDisplayed(100).then(function () {
          return target;
        });
      });
    });
  });
};

const getTargetFromMain = function (driver, selector) {
  return driver.$(selector);
};

export const getTarget = function (driver, data) {
  const selector = data.selector;
  const getter = selector.indexOf('=>') > -1 ? getTargetFromFrame : getTargetFromMain;
  return getter(driver, selector);
};

export const performActionOnTarget = function (driver, data, action) {
  return getTarget(driver, data).then(function (target) {
    return action(target).then(function (result) {
      return driver.switchToFrame(null).then(function () {
        return result;
      });
    });
  }).catch(function (err) {
    return driver.switchToFrame(null).then(function () {
      return Promise.reject(err);
    });
  });
};