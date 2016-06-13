var shutdown = function (promise, driver, done) {
  promise.then(function (/* res */) {
    // All good, so continue.
    driver.sleep(1000);
    driver.quit().then(function () {
      console.log('All tests passed.');
      done();
    });
  }, function (err) {
    driver.sleep(1000);
    driver.quit().then(function () {
      console.error('********* Unexpected Bedrock Error -> Server Quitting ***********', err);
      done();
      throw err;
    });
  });
};

var go = function (settings) {
  var serve = require('./bedrock/server/serve');
  var attempt = require('./bedrock/core/attempt');

  var poll = require('./bedrock/poll/poll');
  var reporter = require('./bedrock/core/reporter');

  var master = require('./bedrock/server/drivermaster').create();

  var driver = require('./bedrock/auto/driver').create({
    browser: settings.browser
  });

  var serveSettings = {
    projectdir: settings.projectdir,
    basedir: settings.basedir,
    config: settings.config,
    testfiles: settings.testfiles,
    driver: attempt.passed(driver),
    master: master,
    page: 'src/resources/bedrock.html'
  };

  var isPhantom = settings.browser === 'phantomjs';

  serve.start(serveSettings, function (service, done) {
    if (! isPhantom) console.log('bedrock-auto available at: http://localhost:' + service.port);
    var result = driver.get('http://localhost:' + service.port).then(function () {
      var message = isPhantom ? '\nPhantom tests loading ...\n' : '\n ... Initial page has loaded ...';
      console.log(message);
      service.markLoaded();
      return poll.loop(master, driver, settings).then(function (data) {
        return reporter.write({
          name: settings.name,
          output: settings.output
        })(data);
      });
    });
    shutdown(result, driver, done);
  });
};

module.exports = {
  go: go,
  mode: 'forAuto'
};
