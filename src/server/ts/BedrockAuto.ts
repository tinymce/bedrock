import * as Serve from './bedrock/server/Serve';
import { Attempt } from './bedrock/core/Attempt';
import * as Version from './bedrock/core/Version';
import * as RunnerRoutes from './bedrock/server/RunnerRoutes';
import * as Reporter from './bedrock/core/Reporter';
import * as DriverMaster from './bedrock/server/DriverMaster';
import * as Driver from './bedrock/auto/Driver';
import * as Lifecycle from './bedrock/core/Lifecycle';
import { ExitCodes } from './bedrock/util/ExitCodes';

export const go = function (settings) {
  const master = DriverMaster.create();

  const isPhantom = settings.browser === 'phantomjs';

  const basePage = isPhantom ? 'src/resources/bedrock-phantom.html' : 'src/resources/bedrock.html';
  const routes = RunnerRoutes.generate('auto', settings.projectdir, settings.basedir, settings.config, settings.bundler, settings.testfiles, settings.chunk, settings.retries, settings.singleTimeout, settings.stopOnFailure, basePage, settings.coverage);

  console.log('bedrock-auto ' + Version.get() + ' starting...');

  routes.then(function (runner) {
    Driver.create({
      browser: settings.browser,
      basedir: settings.basedir,
      debuggingPort: settings.debuggingPort,
      useSandboxForHeadless: settings.useSandboxForHeadless
    }).then(function (driver) {
      const webdriver = driver.webdriver;
      const serveSettings = {
        projectdir: settings.projectdir,
        basedir: settings.basedir,
        testfiles: settings.testfiles,
        driver: Attempt.passed(webdriver),
        master: master,
        runner: runner,
        loglevel: settings.loglevel,
        customRoutes: settings.customRoutes,
        stickyFirstSession: true,
        overallTimeout: settings.overallTimeout,
        singleTimeout: settings.singleTimeout,
        skipResetMousePosition: settings.skipResetMousePosition
      };

      return Serve.start(serveSettings).then(function (service) {
        if (!isPhantom) console.log('bedrock-auto ' + Version.get() + ' available at: http://localhost:' + service.port);
        const result = webdriver.url('http://localhost:' + service.port).then(function () {
          console.log(isPhantom ? '\nPhantom tests loading ...\n' : '\nInitial page has loaded ...\n');
          service.markLoaded();
          service.enableHud();
          return service.awaitDone().then(function (data) {
            return Reporter.write({
              name: settings.name,
              output: settings.output
            })(data);
          }).catch(function (pollExit) {
            return Reporter.writePollExit({
              name: settings.name,
              output: settings.output
            }, pollExit);
          });
        });

        const delayExit = settings.delayExit !== undefined ? settings.delayExit : false;
        const gruntDone = settings.gruntDone !== undefined ? settings.gruntDone : null;
        const done = () => Promise.all([ service.shutdown(), driver.shutdown() ]);

        return Lifecycle.shutdown(result, webdriver, done, gruntDone, delayExit);
      });
    }).catch(function (err) {
      console.error(err);
      if (settings.gruntDone !== undefined) settings.gruntDone(false);
      else process.exit(ExitCodes.failures.unexpected);
    });
  });
};

export const mode = 'forAuto';
