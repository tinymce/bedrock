import * as webdriver from 'selenium-webdriver';
import * as EffectUtils from './EffectUtils';

const Key = webdriver.Key;

const NO_ACTION = null;

const scanCombo = function (combo) {
  // Does not currently support complex key combinations.
  if (combo.ctrlKey) return Key.chord(Key.CONTROL, combo.key);
  else if (combo.metaKey) return Key.chord(Key.COMMAND, combo.key);
  else if (combo.shiftKey) return Key.chord(Key.SHIFT, combo.key);
  return NO_ACTION;
};

const scanItem = function (item) {
  if (item.text) return item.text;
  else if (item.combo) return scanCombo(item.combo);
  return NO_ACTION;
};

const scan = function (keys) {
  // Use map.
  const actions = [];
  for (let i = 0; i < keys.length; i++) {
    const action = scanItem(keys[i]);
    if (action !== NO_ACTION) actions.push(action);
  }
  return actions;
};

/*
 JSON API for data: {
   keys: [
     { text :: String } | { combo :: { ctrlKey :: Bool, key :: String } }
   ],
   selector :: String
 }
 */

const execute = function (driver, data) {
  const actions = scan(data.keys);
  return EffectUtils.getTarget(driver, data).then(function (target) {
    return target.sendKeys.apply(target, actions).then(function (x) {
      return driver.switchTo().defaultContent().then(function () {
        return x;
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
