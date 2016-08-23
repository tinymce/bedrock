var go = function (settings) {
  var serve = require('./bedrock/repl/serve');
  var attempt = require('./bedrock/core/attempt');
  var replroutes = require('./bedrock/repl/replroutes');

  var runner = replroutes.generate(settings.projectdir, settings.basedir, settings.config, settings.repl);

  var serveSettings = {
    projectdir: settings.projectdir,
    basedir: settings.basedir,
    testfiles: settings.testfiles,
    // There is no driver for manual mode.
    driver: attempt.failed('There is no webdriver for manual mode'),
    master: null, // there is no need for master,
    runner: runner,
    loglevel: settings.loglevel
  };

  serve.start(serveSettings, function (service/* , done */) {
    console.log('bedrock (manual) available at: http://localhost:' + service.port);
  });
};

module.exports = {
  go: go,
  mode: 'forRepl'
};

