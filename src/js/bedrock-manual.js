var go = function (settings) {
  settings.stopOnFailure = true;
  var attempt = require('./bedrock/core/attempt');
  var version = require('./bedrock/core/version');
  var runnerroutes = require('./bedrock/server/runnerroutes');
  var webpack = require('./bedrock/compiler/webpack');

  var routes = runnerroutes.generate('manual', settings.projectdir, settings.basedir, settings.config, settings.bundler, settings.testfiles, settings.chunk, settings.retries, settings.singleTimeout, settings.stopOnFailure, 'src/resources/bedrock.html');

  console.log('bedrock-manual ' + version + ' starting...');

  routes.then((runner) => {
    var serveSettings = {
      projectdir: settings.projectdir,
      basedir: settings.basedir,
      testfiles: settings.testfiles,
      // There is no driver for manual mode.
      driver: attempt.failed('There is no webdriver for manual mode'),
      master: null, // there is no need for master,
      runner: runner,
      loglevel: settings.loglevel,
      customRoutes: settings.customRoutes,
      config: settings.config,
      coverage: settings.coverage,
      overallTimeout: settings.overallTimeout,
      singleTimeout: settings.singleTimeout,
      // reset mouse position will never work on manual
      resetMousePosition: false
    };

    webpack.devserver(serveSettings, function (service/* , done */) {
      service.enableHud();
      console.log('bedrock-manual ' + version + ' available at: http://localhost:' + service.port);
    });
  });
};

module.exports = {
  go: go,
  mode: 'forManual'
};

