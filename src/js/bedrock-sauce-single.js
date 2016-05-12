var run = function (directories) {
  var cli = require('./bedrock/core/cli');
  var cloption = require('./bedrock/core/cloption');
  var poll = require('./bedrock/poll/poll');
  var capitalize = require('capitalize');
  var saucejobs = require('./bedrock/remote/sauce-jobs');

  var rest = process.argv.slice(2);
  var params = cloption.parse(rest, [
    cloption.param('base', '(URL): the URL to launch to run the tests (remote site)', cloption.isAny, 'REMOTE_BASE'),
    cloption.param('sauceJob', '(String): the name of the SauceLabs job (e.g. bedrock-test)', cloption.isAny, 'SAUCE_JOB'),
    cloption.param('sauceBrowser', '(String): the browser to use', cloption.isAny, 'SAUCE_BROWSER'),
    cloption.param('sauceBrowserVersion', '(String) the browser version to use', cloption.isAny, 'SAUCE_BROWSER_VERSION'),
    cloption.param('sauceOS', '(String): the OS for the test', cloption.isAny, 'SAUCE_OS'),
    cloption.param('sauceUser', '(String): the SauceLabs user', cloption.isAny, 'SAUCE_USER'),
    cloption.param('sauceKey', '(String): the SauceLabs key', cloption.isAny, 'SAUCE_KEY'),
    cloption.param('outputDir', '(Filename): Output directory for test file. If it does not exist, it is created.', cloption.isAny, 'OUTPUT_DIR')
  ], 'sauce-labs-single');

  var jobs = saucejobs.create(params);

  var settings = cli.extract(params, directories);

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
};

module.exports = {
  run: run
};
