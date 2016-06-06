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
var execute = function (driver, data) {
  var actions = scan(data.keys);
  var target = driver.findElement(By.css(data.selector));
  return target.sendKeys.apply(target, actions);
};

var executor = function (driver) {
  return function (data) {
    return execute(driver, data);
  };
};

module.exports = {
  executor: executor
};
