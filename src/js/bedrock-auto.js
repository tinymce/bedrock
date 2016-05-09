  var shutdown = function (promise, driver, done) {
    promise.then(function (res) {
      // All good, so continue.
      driver.sleep(1000);
      driver.quit().then(function () {
        done();
      });
    }, function (err) {
      driver.sleep(1000);
      driver.quit().then(function () {
        done();
        throw err;
      });
    });
  };

var run = function (directories) {  
  var driver = require('./bedrock/auto/driver').create({
    browser: 'chrome'
  });

  var serve = require('./bedrock/server/serve');

  var cli = require('./bedrock/core/cli');
  var poll = require('./bedrock/poll/poll');
  var reporter = require('./bedrock/core/reporter');

  var settings = cli.extract(directories);

  var serveSettings = {
    projectdir: settings.projectdir,
    basedir: settings.basedir,
    config: settings.config,
    testfiles: settings.testfiles,
    driver: driver
  };

  serve.start(serveSettings, function (service, done) {
    console.log('Hosted bedrock at http://localhost:' + service.port);
    var result = driver.get('http://localhost:' + service.port).then(function () {
      return poll.loop(driver, settings).then(reporter.write({
        name: 'bedrock-auto-test'
      }));
    });
    shutdown(result, driver, done);
  });
};


module.exports = {
  run: run
};
