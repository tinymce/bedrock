var shutdown = function (promise, driver, done) {
  // promise.then(function (/* res */) {
  //   // All good, so continue.
  //   driver.sleep(1000);
  //   driver.quit().then(function () {
  //     console.log('All tests passed.');
  //     done();
  //   });
  // }, function (err) {
  //   driver.sleep(1000);
  //   driver.quit().then(function () {
  //     console.error('********* Unexpected Bedrock Error -> Server Quitting ***********', err);
  //     done();
  //     throw err;
  //   });
  // });
};

var go = function (settings) {
  var serve = require('./bedrock/server/pageserve');
  var attempt = require('./bedrock/core/attempt');

  var poll = require('./bedrock/poll/poll');
  var reporter = require('./bedrock/core/reporter');

  var master = require('./bedrock/server/drivermaster').create();

  var path = require('path');

  var driver = require('./bedrock/auto/driver').create({
    browser: settings.browser
  });

  var serveSettings = {
    projectdir: settings.projectdir,
    basedir: settings.basedir,
    driver: attempt.passed(driver),
    master: master,
    page: settings.page
  };

  var pollSettings = {
    overallTimeout: 10 * 60 * 1000,
    testName: 'p#qunit-result .test-name',
    singleTimeout: null,
    done: '#qunit-banner.qunit-fail,#qunit-banner.qunit-pass',
    results: '.results'
  };

  serve.start(serveSettings, function (service, done) {
    console.log('bedrock-auto available at: http://localhost:' + service.port);
    var result = driver.get('http://localhost:' + service.port + '/' + settings.page).then(function () {
      console.log('\n ... Initial page has loaded ...');
      service.markLoaded();

      var scriptFile = path.join('/page', 'src', 'resources', 'qunit-wrapper.js');
      console.log('scriptFile', scriptFile);
      return driver.executeScript(function (src) {
        var script = document.createElement('script');
        script.setAttribute('src', src);
        document.head.appendChild(script);
      }, scriptFile).then(function () {


      return poll.loop(master, driver, pollSettings).then(function (data) {
        return reporter.write({
          name: settings.name,
          output: settings.output
        })(data);
      });

      });
    });
    shutdown(result, driver, done);
  });
};

module.exports = {
  go: go,
  mode: 'forPage'
};
