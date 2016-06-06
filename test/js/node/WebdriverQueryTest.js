var driver = require('../../../src/js/bedrock/auto/driver').create({
  browser: 'firefox'
});

driver.manage().timeouts().setScriptTimeout(30000);

var makePromise2 = function (aInput, aAmount) {
  return new Promise(function (resolve, reject) {
    var start = new Date().getTime();
    setTimeout(function () {
      var finish = new Date().getTime();
      resolve({
        v: aInput,
        delay: aAmount,
        actualDelay: finish - start,
        start: start,
        finish: finish
      });
    }, aAmount);
  }).then(function (v) {
    // if (v !== input) return Promise.reject('Response out of sync. Expected "' + input + '", but was "' + JSON.stringify(v) + '"');
    console.log('Retrieved: ' + JSON.stringify(v));
    return Promise.resolve(v);
  });
};

var makePromise = function (input, amount) {
  return driver.executeAsyncScript(function (aInput, aAmount) {
    var start = new Date().getTime();
    var done = arguments[arguments.length - 1];
    window.setTimeout(function () {
      var finish = new Date().getTime();
      done({
        v: aInput,
        delay: aAmount,
        actualDelay: finish - start,
        start: start,
        finish: finish
      });
    }, aAmount);
  }, input, amount).then(function (v) {
    // if (v !== input) return Promise.reject('Response out of sync. Expected "' + input + '", but was "' + JSON.stringify(v) + '"');
    console.log('Retrieved: ' + JSON.stringify(v));
    return Promise.resolve(v);
  });
};

Promise.all([
  makePromise('\'a\'', 1000),
  makePromise('\'b\'', 50),
  makePromise('\'c\'', 3000),
  makePromise('\'d\'', 1000)
]).then(function () {
  console.log('Everything is good.');
}, function (err) {
  console.error('error', err);
});

