import * as Serve from './bedrock/server/Serve';
import * as Attempt from './bedrock/core/Attempt';
import * as Version from './bedrock/core/Version';
import * as RunnerRoutes from './bedrock/server/RunnerRoutes';
import * as Reporter from './bedrock/core/Reporter';
import * as DriverMaster from './bedrock/server/DriverMaster';
import * as Driver from './bedrock/auto/Driver';
import * as Lifecycle from './bedrock/core/Lifecycle';

const skipTests = function (reporter, settings, message) {
  // Write results
  reporter.write({
    name: settings.name,
    output: settings.output
  })({
    // Need to add a dummy result, otherwise JUnit fails by default
    results: [
      {
        name: 'SkippedTest',
        file: 'SkippedTest.ts',
        passed: false,
        skipped: message,
        time: '0',
        error: null
      }
    ],
    start: Date.now(),
    now: Date.now()
  });

  if (settings.gruntDone !== undefined) {
    settings.gruntDone(true);
  }
};

export const go = function (settings) {
  // If the browser is Safari, then we need to skip the tests because in v12.1 they removed
  // the --legacy flag in safaridriver which was required to run webdriver.
  // see https://github.com/SeleniumHQ/selenium/issues/6431#issuecomment-477408650
  if (settings.browser === 'safari') {
    console.warn('Skipping tests as webdriver is currently broken on Safari');
    skipTests(Reporter, settings, 'Selenium webdriver is currently broken on Safari, see: https://github.com/SeleniumHQ/selenium/issues/6431#issuecomment-477408650');
    return;
  }

  const master = DriverMaster.create();

  const isPhantom = settings.browser === 'phantomjs';

  const basePage = isPhantom ? 'src/resources/bedrock-phantom.html' : 'src/resources/bedrock.html';
  const routes = RunnerRoutes.generate('auto', settings.projectdir, settings.basedir, settings.config, settings.bundler, settings.testfiles, settings.chunk, settings.retries, settings.singleTimeout, settings.stopOnFailure, basePage, settings.coverage);

  console.log('bedrock-auto ' + Version.get() + ' starting...');

  routes.then((runner) => {
    Driver.create({
      browser: settings.browser,
      basedir: settings.basedir,
      debuggingPort: settings.debuggingPort,
      useSandboxForHeadless: settings.useSandboxForHeadless
    }).then(function (driver) {
      const serveSettings = {
        projectdir: settings.projectdir,
        basedir: settings.basedir,
        testfiles: settings.testfiles,
        driver: Attempt.passed(driver),
        master: master,
        runner: runner,
        loglevel: settings.loglevel,
        customRoutes: settings.customRoutes,
        stickyFirstSession: true,
        overallTimeout: settings.overallTimeout,
        singleTimeout: settings.singleTimeout,
        skipResetMousePosition: settings.skipResetMousePosition
      };

      Serve.start(serveSettings, function (service, done) {
        if (!isPhantom) console.log('bedrock-auto ' + Version + ' available at: http://localhost:' + service.port);
        const result = driver.get('http://localhost:' + service.port)
          .then(driver.executeScript('window.focus();'))
          .then(function () {
            const message = isPhantom ? '\nPhantom tests loading ...\n' : '\nInitial page has loaded ...\n';
            console.log(message);
            service.markLoaded();
            service.enableHud();
            return service.awaitDone().then(function (data) {
              return Reporter.write({
                name: settings.name,
                output: settings.output
              })(data);
            }, function (pollExit) {
              return Reporter.writePollExit({
                name: settings.name,
                output: settings.output
              }, pollExit);
            });
          });

        Lifecycle.shutdown(result, driver, done, settings.gruntDone !== undefined ? settings.gruntDone : null, settings.delayExit !== undefined ? settings.delayExit : false);
      });
    }, function (err) {
      console.error('Unable to create driver', err);
    });
  });
};

export const mode = 'forAuto';
