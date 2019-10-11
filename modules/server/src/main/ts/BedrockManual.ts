import { Attempt } from './bedrock/core/Attempt';
import * as Version from './bedrock/core/Version';
import * as RunnerRoutes from './bedrock/server/RunnerRoutes';
import * as Webpack from './bedrock/compiler/Webpack';
import { BedrockSettings } from './bedrock/core/Settings';
import { ExitCodes } from './bedrock/util/ExitCodes';

export const go = (settings: BedrockSettings) => {
  const basePage = 'src/resources/html/bedrock.html';
  const routes = RunnerRoutes.generate('manual', settings.projectdir, settings.basedir, settings.config, settings.bundler, settings.testfiles, settings.chunk, 0, settings.singleTimeout, true, basePage, settings.coverage);

  console.log('bedrock-manual ' + Version.get() + ' starting...');

  routes.then((runner) => {
    const serveSettings: Webpack.WebpackServeSettings = {
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
      // sticky session is used by auto mode only
      stickyFirstSession: false,
      // reset mouse position will never work on manual
      skipResetMousePosition: true
    };

    return Webpack.devserver(serveSettings).then((service) => {
      service.enableHud();
      console.log('bedrock-manual ' + Version.get() + ' available at: http://localhost:' + service.port);
    }, (err) => {
      console.error(err);
      process.exit(ExitCodes.failures.error);
    });
  });
};

export const mode = 'forManual';

