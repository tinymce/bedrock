var driver = require('../../../src/js/bedrock/auto/driver').create({
  browser: 'chrome'
});

driver.manage().timeouts().setScriptTimeout(30000);

var makePromise = function (input, amount) {
  return driver.executeAsyncScript(function (aInput, aAmount) {
    var done = arguments[arguments.length - 1];
    window.setTimeout(function () {
      done(aInput);
    }, aAmount);
  }, input, amount).then(function (v) {
    if (v !== input) return Promise.reject('Response out of sync. Expected "' + input + '", but was "' + v + '"');
    console.log('Retrieved: ' + v);
    return Promise.resolve(v);
  });
};

Promise.all([
  makePromise('\'a\'', 1000),
  makePromise('\'b\'', 1200),
  makePromise('\'c\'', 14000),
  makePromise('\'d\'', 1000)
]).then(function () {
  console.log('Everything is good.');
}, function (err) {
  console.error('error', err);
});

