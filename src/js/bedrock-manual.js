var run = function (directories) {
  var serve = require('./bedrock/server/serve');
  var attempt = require('./bedrock/core/attempt');

  var clis = require('./bedrock/cli/clis.js');

  var maybeSettings = clis.forManual(directories);

  attempt.cata(maybeSettings, function (errs) {
    console.log('errs', errs);
  }, function (settings) {

    console.log('settings', settings);

    var serveSettings = {
      projectdir: settings.projectdir,
      basedir: settings.basedir,
      config: settings.config,
      testfiles: settings.testfiles,
      // There is no driver for manual mode.
      driver: attempt.failed('There is no webdriver for manual mode'),
      master: attempt.failed('There is no master for manual mode'),
      page: 'src/resources/bedrock.html'
    };

    serve.start(serveSettings, function (service/* , done */) {
      console.log('bedrock (manual) available at: http://localhost:' + service.port);
    });
  });
};

module.exports = {
  run: run
};

