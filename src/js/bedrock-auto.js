  var shutdown = function (promise, driver, done) {
    promise.then(function (res) {
      // All good, so continue.
      driver.sleep(1000);
      driver.quit().then(function () {
        console.log('All tests passed.');
        done();
      });
    }, function (err) {
      driver.sleep(1000);
      driver.quit().then(function () {
        done();
        throw new Error(err);
      });
    });
  };

var run = function (directories) {
  var serve = require('./bedrock/server/serve');

  var cli = require('./bedrock/core/cli');
  var cloption = require('./bedrock/core/cloption');
  var poll = require('./bedrock/poll/poll');
  var reporter = require('./bedrock/core/reporter');

  var rest = process.argv.slice(2);
  var params = cloption.parse(rest, [
    cloption.param('suiteName', '(String): Name for the test suite', cloption.isAny, 'SUITE_NAME'),
    cloption.param('outputDir', '(Filename): Output directory for test file. If it does not exist, it is created.', cloption.isAny, 'OUTPUT_DIR'),
    cloption.param('browser', '(String): Browser value: chrome | firefox | safari | ie | MicrosoftEdge', cloption.isAny, 'BROWSER'),
    cloption.param('testConfig', '(Filename): the filename for the config file', cloption.validateFile, 'CONFIG_FILE'),
    cloption.files('testFiles', '{Filename ...} The set of files to test', '{ TEST1 ... }')
  ], 'bedrock-auto');

  var driver = require('./bedrock/auto/driver').create({
    browser: params.browser
  });

  var settings = cli.extract(params, directories);

  var serveSettings = {
    projectdir: settings.projectdir,
    basedir: settings.basedir,
    config: settings.config,
    testfiles: settings.testfiles,
    driver: driver
  };

  serve.start(serveSettings, function (service, done) {
    console.log('bedrock-auto available at: http://localhost:' + service.port);
    var result = driver.get('http://localhost:' + service.port).then(function () {
      return poll.loop(driver, settings).then(reporter.write({
        name: params.suiteName,
        output: params.outputDir
      }));
    });
    shutdown(result, driver, done);
  });
};


module.exports = {
  run: run
};
