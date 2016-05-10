var run = function (directories) {
  var serve = require('./bedrock/server/serve');

  var cli = require('./bedrock/core/cli');
  var cloption = require('./bedrock/core/cloption');
  var poll = require('./bedrock/poll/poll');

  var params = cloption.parse(process.argv.slice(2), [
    cloption.param('testConfig', '(Filename): the filename for the config file', cloption.validateFile, 'CONFIG_FILE'),
    cloption.files('testFiles', '{Filename ...} The set of files to test', '{ TEST1 ... }')
  ], 'bedrock');

  var settings = cli.extract(params, directories);

  var serveSettings = {
    projectdir: settings.projectdir,
    basedir: settings.basedir,
    config: settings.config,
    testfiles: settings.testfiles,
    // There is no driver for manual mode.
    driver: null
  };

  serve.start(serveSettings, function (service, done) {
    console.log('bedrock (manual) available at: http://localhost:' + service.port);
  });
};


module.exports = {
  run: run
};

