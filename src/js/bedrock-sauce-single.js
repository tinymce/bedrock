var run = function (directories) {
  var poll = require('./bedrock/poll/poll');
  var capitalize = require('capitalize');
  var saucejobs = require('./bedrock/remote/sauce-jobs');

  var attempt = require('./bedrock/core/attempt');
  var clis = require('./bedrock/cli/clis');

  var maybeSettings = clis.forSauceSingle(directories);
  attempt.cata(maybeSettings, clis.log, function (settings) {
    console.log('settings', settings);
    process.exit(0);

    // Get from settings.
    var params = { };

    var jobs = saucejobs.create(params);

    var drivers = require('./bedrock/remote/driver');

    var prettify = function (os, browser, bversion) {
      return [ capitalize(browser) ].concat(bversion === 'latest' ? [ ] : [ bversion ]).concat([ capitalize(os) ]).join('.');
    };

    var driver = drivers.create(params.sauceUser, params.sauceKey, {
      browser: params.sauceBrowser,
      browserVersion: params.sauceBrowserVersion,
      os: params.sauceOS
    });

    var detailedName = prettify(params.sauceOS, params.sauceBrowser, params.sauceBrowserVersion);

    driver.get(params.base + '/index.html').then(function () {
      console.log('Starting SauceLabs platform: ' + detailedName);
      var jobResult = jobs.runTest(detailedName, driver, function () {
        return poll.loop(driver, settings);
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
      process.exit(0);
    }, function (err) {
      console.log('Failed SauceLabs platform: ' + detailedName);
      console.error(err);
      process.exit(-1);
    });
  });
};

module.exports = {
  run: run
};
