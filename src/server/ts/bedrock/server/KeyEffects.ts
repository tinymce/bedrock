import * as EffectUtils from './EffectUtils';

const NO_ACTION = null;

// See https://w3c.github.io/webdriver/#keyboard-actions for key codes
const KEYS = {
  'null': '\u0000', // Reset keys
  'backspace': '\uE003',
  'tab': '\uE004',
  'clear': '\uE005',
  'return': '\uE006',
  'enter': '\uE007',
  'shift': '\uE008',
  'control': '\uE009',
  'alt': '\uE00A',
  'escape': '\uE00C',
  'pageup': '\uE00E',
  'pagedown': '\uE00F',
  'end': '\uE010',
  'home': '\uE011',
  'arrowleft': '\uE012',
  'arrowup': '\uE013',
  'arrowright': '\uE014',
  'arrowdown': '\uE015',
  'insert': '\uE016',
  'delete': '\uE017',

  // Tab key (Firefox doesn't remap it)
  '\t': '\uE004',

  // Function keys
  'f1': '\uE031',
  'f2': '\uE032',
  'f3': '\uE033',
  'f4': '\uE034',
  'f5': '\uE035',
  'f6': '\uE036',
  'f7': '\uE037',
  'f8': '\uE038',
  'f9': '\uE039',
  'f10': '\uE03A',
  'f11': '\uE03B',
  'f12': '\uE03C',

  'meta': '\uE053'
};

const mapKeys = function (action) {
  return action.map(function (key) {
    if (KEYS.hasOwnProperty(key.toLowerCase())) return KEYS[key.toLowerCase()];
    else return key;
  });
};

const scanCombo = function (combo) {
  const keys = [];
  if (combo.ctrlKey) keys.push('Control');
  if (combo.metaKey) keys.push('Meta');
  if (combo.shiftKey) keys.push('Shift');
  if (combo.altKey) keys.push('Alt');
  keys.push(combo.key);
  return mapKeys(keys);
};

const scanItem = function (item) {
  if (item.text) return mapKeys([item.text]);
  else if (item.combo) return scanCombo(item.combo);
  return NO_ACTION;
};

const scan = function (keys) {
  return keys.reduce(function (acc, key) {
    const action = scanItem(key);
    if (action !== NO_ACTION) {
      return acc.concat(action);
    } else {
      return acc;
    }
  }, []);
};

const performAction = function (driver, target, actions, isW3C) {
  if (isW3C) {
    return driver.elementSendKeys(target.elementId, actions.join(''));
  } else {
    return driver.elementSendKeys(target.elementId, actions);
  }
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
    return performAction(driver, target, actions, driver.isW3C).then(function (x) {
      return driver.switchToFrame(null).then(function () {
        return x;
      });
    }).catch(function (err) {
      return driver.switchToFrame(null).then(function () {
        return Promise.reject(err);
      });
    });
  });
};

export const executor = function (driver) {
  return function (data) {
    return execute(driver, data);
  };
};
