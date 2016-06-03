var webdriver = require('selenium-webdriver');
// var input = require('../../../../node_modules/selenium-webdriver/lib/input');
var By = webdriver.By;
var Key = webdriver.Key;

var NO_ACTION = null;

var scanCombo = function (combo) {
  if (combo.ctrlKey) return Key.chord(Key.CONTROL, combo.key);
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
  console.log('I am receiving a key effect: \n' + JSON.stringify(data));
  var actions = scan(data.keys);
  var target = driver.findElement(By.css(data.selector));
  return target.sendKeys.apply(target, actions).then(function (x) {
    return x;
  }, function (err) {
    console.log('Silently fail');
    return Promise.resolve({})
  }).then(function (v) {
    return new Promise(function (resolve, reject) {
      console.log('delaying response ...');
      setTimeout(function () {
        resolve(v);
      }, 1000);
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
