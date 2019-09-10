import { Attempt } from './bedrock/core/Attempt';
import * as Version from './bedrock/core/Version';
import * as RunnerRoutes from './bedrock/server/RunnerRoutes';
import * as Webpack from './bedrock/compiler/Webpack';

export const go = function (settings) {
  settings.stopOnFailure = true;

  // TODO: where should this setting come from? Is it used?
  const delayExiting = false;
  const routes = RunnerRoutes.generate('manual', settings.projectdir, settings.basedir, settings.config, settings.bundler, settings.testfiles, settings.chunk, settings.retries, settings.singleTimeout, settings.stopOnFailure, 'src/resources/bedrock.html', delayExiting);

  console.log('bedrock-manual ' + Version.get() + ' starting...');

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

    Webpack.devserver(serveSettings).then(function (service) {
      service.enableHud();
      console.log('bedrock-manual ' + Version.get() + ' available at: http://localhost:' + service.port);
    });
  });
};

export const mode = 'forManual';

