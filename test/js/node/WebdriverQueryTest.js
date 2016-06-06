var driver = require('../../../src/js/bedrock/auto/driver').create({
  browser: 'firefox'
});


var makePromise = function (input) {
  return driver.executeScript('return \'' + input + '\'').then(function (v) {
    if (v !== input) return Promise.reject('Response out of sync. Expected "' + input + '", but was "' + v + '"');
    return v;
  });
};


Promise.all([
  makePromise('a'),
  makePromise('b'),
  makePromise('c'),
  makePromise('d')
]).then(function () {
  console.log('Everything is good.');
}, function (err) {
  console.error('error', err);
});

