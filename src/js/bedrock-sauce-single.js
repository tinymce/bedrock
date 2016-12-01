var go = function (settings) {
  var poll = require('./bedrock/poll/poll');
  var capitalize = require('capitalize');
  var saucejobs = require('./bedrock/remote/sauce-jobs');

  var attempt = require('./bedrock/core/attempt');

  console.log('settings', settings);

  var jobs = saucejobs.create(settings);

  var drivers = require('./bedrock/remote/driver');
  var exitcodes = require('./bedrock/util/exitcodes');

  var prettify = function (os, browser, bversion) {
    return [ capitalize(browser) ].concat(bversion === 'latest' ? [ ] : [ bversion ]).concat([ capitalize(os) ]).join('.');
  };

  var driver = drivers.create(settings.sauceuser, settings.saucekey, {
    browser: settings.saucebrowser,
    browserVersion: settings.saucebrowserVersion,
    os: settings.sauceos
  });

  var detailedName = prettify(settings.sauceos, settings.saucebrowser, settings.saucebrowserVersion);

  driver.get(settings.remoteurl + '/index.html').then(function () {
    var master = require('./bedrock/server/drivermaster').create();

    console.log('Starting SauceLabs platform: ' + detailedName);
    var jobResult = jobs.runTest(detailedName, driver, function () {
      return poll.loop(master, driver, settings);
    });

    return jobResult.then(function (result) {
      return driver.quit().then(function () {
        if (process.send) process.send({ success: result });
        return Promise.resolve(result);
      });
    }, function (err) {
      return driver.quit().then(function () {
        if (process.send) process.send({ failure: err });
        return Promise.reject(err);
      });
    });
  }).then(function (/* res */) {
    console.log('Passed SauceLabs platform: ' + detailedName);
    process.exit(exitcodes.success);
  }, function (err) {
    console.log('Failed SauceLabs platform: ' + detailedName);
    console.error(err);
    process.exit(exitcodes.failures.tests);
  });
};

module.exports = {
  go: go,
  mode: 'forSauceSingle'
};
