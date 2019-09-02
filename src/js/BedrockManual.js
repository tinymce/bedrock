const Attempt = require('./bedrock/core/Attempt');
const Version = require('./bedrock/core/Version');
const RunnerRoutes = require('./bedrock/server/RunnerRoutes');
const Webpack = require('./bedrock/compiler/Webpack');

const go = function (settings) {
  settings.stopOnFailure = true;

  const routes = RunnerRoutes.generate('manual', settings.projectdir, settings.basedir, settings.config, settings.bundler, settings.testfiles, settings.chunk, settings.retries, settings.singleTimeout, settings.stopOnFailure, 'src/resources/bedrock.html');

  console.log('bedrock-manual ' + Version + ' starting...');

  routes.then((runner) => {
    const serveSettings = {
      projectdir: settings.projectdir,
      basedir: settings.basedir,
      testfiles: settings.testfiles,
      // There is no driver for manual mode.
      driver: Attempt.failed('There is no webdriver for manual mode'),
      master: null, // there is no need for master,
      runner: runner,
      loglevel: settings.loglevel,
      customRoutes: settings.customRoutes,
      config: settings.config,
      coverage: settings.coverage,
      overallTimeout: settings.overallTimeout,
      singleTimeout: settings.singleTimeout,
      // reset mouse position will never work on manual
      skipResetMousePosition: true
    };

    Webpack.devserver(serveSettings, function (service/* , done */) {
      service.enableHud();
      console.log('bedrock-manual ' + Version + ' available at: http://localhost:' + service.port);
    });
  });
};

module.exports = {
  go: go,
  mode: 'forManual'
};

