var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var until = webdriver.until;

var fs   = require('fs');
var path = require('path');
var cwd  = path.join(path.dirname(fs.realpathSync(__filename)));
console.log('cwd', cwd);

var driver = require('../../../src/js/bedrock/auto/driver').create({
  browser: 'firefox'
});

driver.manage().timeouts().setScriptTimeout(30000);

driver.get('file://' + cwd + '/page.html');

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

var makeSyncPromise = function (input, amount) {
  return driver.executeScript(function (aInput, aAmount) {
    var start = new Date().getTime();
    var finish = new Date().getTime();
    return {
      v: aInput,
      delay: aAmount,
      actualDelay: finish - start,
      start: start,
      finish: finish
    };
  }, input, amount).then(function (v) {
    // if (v !== input) return Promise.reject('Response out of sync. Expected "' + input + '", but was "' + JSON.stringify(v) + '"');
    console.log('Retrieved: ' + JSON.stringify(v));
    return Promise.resolve(v);
  });
};

var makeQuery = function (selector) {
  return driver.wait(until.elementLocated(By.css(selector)), 1000).then(function (elem) {
    console.log('found it: [' + selector + ']. checking inner html');
    return elem.getInnerHtml().then(function (html) {
      console.log('found it: [' + selector + ']: ' + html);
      return html;
    }, function (err) {
      console.error('Error on innerHTML', err);
      return Promise.reject(err);
    });
    // return elem;
  }, function (err) {
    console.log('did not find selector: ' + selector, err);
    // return Promise.reject(err);
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

makePromise('a', 100);
makeSyncPromise('a.sync');
makeQuery('input'),
makeQuery('div.progress'),
makeQuery('div.progress'),
makeQuery('input'),
makeQuery('div.progress'),
makePromise('b', 1000);
makePromise('c', 40);
makeQuery('input');
makeQuery('p');
makeQuery('p');
/*
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
*/

