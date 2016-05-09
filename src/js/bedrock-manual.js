var run = function (directories) {
  var serve = require('./bedrock/server/serve');

  var cli = require('./bedrock/core/cli');
  var poll = require('./bedrock/poll/poll');

  var settings = cli.extract(process.argv.slice(2), directories);

  var serveSettings = {
    projectdir: settings.projectdir,
    basedir: settings.basedir,
    config: settings.config,
    testfiles: settings.testfiles,
    // There is no driver for manual mode.
    driver: null
  };

  serve.start(serveSettings, function (service, done) {
    console.log('started on port: ', service.port);
  });
};


module.exports = {
  run: run
};

