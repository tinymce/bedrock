import * as EffectUtils from './EffectUtils';

const performAction = function (target, type) {
  const action = {
    type: 'pointer',
    id: 'pointer1',
    parameters: { pointerType: 'mouse' },
    actions: [
      { type: type, button: 0 },
      { type: 'pause', duration: 10 },
      { type: type, button: 0 }
    ]
  };
  return target.performActions([action]).then(function () {
    return target.releaseActions();
  });
};

/*
 JSON API for data: {
   type :: String, ("move" || "click" || "down" || "up")
   selector :: String
 }
 */
const doAction = function (driver, target, type) {
  if (type === 'move') {
    return target.moveTo();
  } else if (type === 'down' || type === 'up') {
    return target.moveTo().then(function () {
      return performAction(target, type === 'down' ? 'pointerDown' : 'pointerUp');
    });
  // MicrosoftEdge does support this, but does not seem to support click in an ActionSequence
  } else if (type === 'click') {
    return target.click();
  } else {
    return Promise.reject('Unknown mouse effect type: ' + type);
  }
};

const execute = function (driver, data) {
  return EffectUtils.performActionOnTarget(driver, data, function (target) {
    return doAction(driver, target, data.type);
  });
};

export const executor = function (driver) {
  return function (data) {
    return execute(driver, data);
  };
};
