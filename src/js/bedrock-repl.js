var go = function (settings) {
  var serve = require('./bedrock/repl/serve');
  var attempt = require('./bedrock/core/attempt');
  var version = require('./bedrock/core/version');
  var replroutes = require('./bedrock/repl/replroutes');

  var runner = replroutes.generate(settings.projectdir, settings.basedir, settings.config, settings.repl);

  var serveSettings = {
    projectdir: settings.projectdir,
    basedir: settings.basedir,
    testfiles: settings.testfiles,
    // There is no driver for manual mode.
    driver: attempt.failed('There is no webdriver for repl mode'),
    master: null, // there is no need for master,
    runner: runner,
    loglevel: settings.loglevel,
    customRoutes: settings.customRoutes
  };

  serve.start(serveSettings, function (service/* , done */) {
    console.log('bedrock-repl ' + version + ' available at: http://localhost:' + service.port);
  });
};

module.exports = {
  go: go,
  mode: 'forRepl'
};

