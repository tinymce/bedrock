var go = function (settings) {
  var attempt = require('./bedrock/core/attempt');
  var version = require('./bedrock/core/version');
  var boltroutes = require('./bedrock/server/boltroutes');
  var webpack = require('./bedrock/compiler/webpack');

  var routes = boltroutes.generate('manual', settings.projectdir, settings.basedir, settings.config, settings.bundler, settings.testfiles, settings.stopOnFailure, 'src/resources/bedrock.html');

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
      singleTimeout: settings.singleTimeout
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

