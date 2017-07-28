var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var Key = webdriver.Key;

var NO_ACTION = null;

var scanCombo = function (combo) {
  // Does not currently support complex key combinations.
  if (combo.ctrlKey) return Key.chord(Key.CONTROL, combo.key);
  else if (combo.metaKey) return Key.chord(Key.COMMAND, combo.key);
  return NO_ACTION;
};

var scanItem = function (item) {
  console.log('scanning', item);
  if (item.text) return item.text;
  else if (item.combo) return scanCombo(item.combo);
  return NO_ACTION;
};

var scan = function (keys) {
  // Use map.
  var actions = [ ];
  for (var i = 0; i < keys.length; i++) {
    var action = scanItem(keys[i]);
    if (action !== NO_ACTION) actions.push(action);
  }
  console.log('actions', actions);
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


var execute = function (driver, data) {
  var actions = scan(data.keys);
  return getTarget(driver, data).then(function (target) {
    return target.sendKeys.apply(target, actions).then(function (x) {
      driver.switchTo().defaultContent();
      return x;
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
