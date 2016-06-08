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

var run = function (directories) {
  var serve = require('./bedrock/server/serve');

  var cli = require('./bedrock/core/cli');
  var cloptions = require('./bedrock/core/cloptions');
  var poll = require('./bedrock/poll/poll');
  var reporter = require('./bedrock/core/reporter');

  var settings = cli.extract(
    'bedrock-auto',
    'Use a Webdriver to launch a browser and run tests against it.',
    directories, [
      cloptions.browser,
      cloptions.name,
      cloptions.output
    ]
  );

  var master = require('./bedrock/server/drivermaster.js').create();

  var driver = require('./bedrock/auto/driver').create({
    browser: settings.browser
  });

  var serveSettings = {
    projectdir: settings.projectdir,
    basedir: settings.basedir,
    config: settings.config,
    testfiles: settings.testfiles,
    driver: driver,
    master: master
  };

  serve.start(serveSettings, function (service, done) {
    console.log('bedrock-auto available at: http://localhost:' + service.port);
    var result = driver.get('http://localhost:' + service.port).then(function () {
      console.log('\n ... Initial page has loaded ...');
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
  run: run
};
