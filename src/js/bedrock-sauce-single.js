var go = function (settings) {
  var poll = require('./bedrock/poll/poll');
  var capitalize = require('capitalize');
  var saucejobs = require('./bedrock/remote/sauce-jobs');

  var attempt = require('./bedrock/core/attempt');

  var jobs = saucejobs.create(settings);

  var drivers = require('./bedrock/remote/driver');
  var exitcodes = require('./bedrock/util/exitcodes');

  var prettify = function (os, browser, bversion) {
    return [ capitalize(browser) ].concat(bversion === 'latest' ? [ ] : [ bversion ]).concat([ capitalize(os) ]).join('.');
  };

  // sauce labs properties, some of these are generic remote selenium properties others are sauce labs specific
  var driverConf = {
    browserName: settings.saucebrowser,
    version: settings.saucebrowserVersion,
    platform: settings.sauceos,
    name: settings.name,
    build: settings.saucebuild,
    'max-duration':Math.floor(settings.overallTimeout / 1000)
  };
  console.log('creating driver with config', JSON.stringify(driverConf));
  var driver = drivers.create(settings.sauceuser, settings.saucekey, driverConf);

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
