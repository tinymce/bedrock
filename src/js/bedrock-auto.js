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
  var cloption = require('./bedrock/core/cloption');
  var poll = require('./bedrock/poll/poll');
  var reporter = require('./bedrock/core/reporter');

  var rest = process.argv.slice(2);
  var params = cloption.parse(rest, [
    cloption.param('testConfig', '(Filename): the filename for the config file', cloption.validateFile, 'CONFIG_FILE'),
    cloption.files('testFiles', '{Filename ...} The set of files to test', '{ TEST1 ... }')
  ], 2, 'Usage');

  var settings = cli.extract(params, directories);

  console.log('settings', settings);

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
