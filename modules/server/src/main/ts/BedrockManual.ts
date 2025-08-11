import { Attempt } from './bedrock/core/Attempt';
import * as Version from './bedrock/core/Version';
import * as RunnerRoutes from './bedrock/server/RunnerRoutes';
import * as BunDevServer from './bedrock/server/BunDevServer';
import { BedrockManualSettings } from './bedrock/core/Settings';
import { ExitCodes } from './bedrock/util/ExitCodes';
import * as SettingsResolver from './bedrock/core/SettingsResolver';

export const go = (bedrockManualSettings: BedrockManualSettings): void => {
  console.log('bedrock-manual ' + Version.get() + ' starting...');

  const settings = SettingsResolver.resolveAndLog(bedrockManualSettings);
  const basePage = 'src/resources/html/bedrock.html';
  const routes = RunnerRoutes.generate('manual', settings.projectdir, settings.basedir, settings.config, settings.bundler, settings.testfiles, settings.chunk, 0, settings.singleTimeout, true, basePage, settings.coverage, settings.polyfills, settings.turbo);

  routes.then(async (runner) => {
    const serveSettings: BunDevServer.BunDevServerSettings = {
      ...settings,
      driver: Attempt.failed('There is no webdriver for manual mode'),
      master: null,
      runner,
      stickyFirstSession: false,
      skipResetMousePosition: true,
      enableHotReload: true,
      watchFiles: settings.testfiles
    };

    try {
      const service = await BunDevServer.startBunDevServer(serveSettings);
      service.enableHud();
      console.log('bedrock-manual ' + Version.get() + ' available at: http://localhost:' + service.port);
    } catch (err) {
      console.error(err);
      process.exit(ExitCodes.failures.error);
    }
  });
};

export const mode = 'forManual';

