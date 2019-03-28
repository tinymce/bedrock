var skipTests = function (reporter, settings) {
  // Write results
  reporter.write({
    name: settings.name,
    output: settings.output
  })({
    results: [],
    start: Date.now(),
    now: Date.now()
  });

  if (settings.gruntDone !== undefined) {
    settings.gruntDone(true);
  }
};

var go = function (settings) {
  var serve = require('./bedrock/server/serve');
  var attempt = require('./bedrock/core/attempt');
  var version = require('./bedrock/core/version');

  var runnerroutes = require('./bedrock/server/runnerroutes');

  var reporter = require('./bedrock/core/reporter');

  // If the browser is Safari, then we need to skip the tests because in v12.1 they removed the
  // --legacy flag in safaridriver that was required to run webdriver
  if (settings.browser === 'safari') {
    console.warn('Skipping tests as webdriver is currently broken on Safari');
    skipTests(reporter, settings);
    return;
  }

  var master = require('./bedrock/server/drivermaster').create();
  var driver = require('./bedrock/auto/driver');

  var isPhantom = settings.browser === 'phantomjs';

  var basePage = isPhantom ? 'src/resources/bedrock-phantom.html' : 'src/resources/bedrock.html';

  var lifecycle = require('./bedrock/core/lifecycle');
  var routes = runnerroutes.generate('auto', settings.projectdir, settings.basedir, settings.config, settings.bundler, settings.testfiles, settings.chunk, settings.retries, settings.singleTimeout, settings.stopOnFailure, basePage, settings.coverage);

  console.log('bedrock-auto ' + version + ' starting...');

  routes.then((runner) => {
    driver.create({
      browser: settings.browser,
      basedir: settings.basedir,
      debuggingPort: settings.debuggingPort
    }).then(function (driver) {
      var serveSettings = {
        projectdir: settings.projectdir,
        basedir: settings.basedir,
        testfiles: settings.testfiles,
        driver: attempt.passed(driver),
        master: master,
        runner: runner,
        loglevel: settings.loglevel,
        customRoutes: settings.customRoutes,
        stickyFirstSession: true,
        overallTimeout: settings.overallTimeout,
        singleTimeout: settings.singleTimeout
      };

      serve.start(serveSettings, function (service, done) {
        if (!isPhantom) console.log('bedrock-auto ' + version + ' available at: http://localhost:' + service.port);
        var result = driver.get('http://localhost:' + service.port)
                           .then(driver.executeScript('window.focus();'))
                           .then(function () {
          var message = isPhantom ? '\nPhantom tests loading ...\n' : '\nInitial page has loaded ...\n';
          console.log(message);
          service.markLoaded();
          service.enableHud();
          return service.awaitDone().then(function (data) {
            return reporter.write({
              name: settings.name,
              output: settings.output
            })(data);
          }, function (pollExit) {
            return reporter.writePollExit({
              name: settings.name,
              output: settings.output
            }, pollExit);
          });
        });

        lifecycle.shutdown(result, driver, done, settings.gruntDone !== undefined ? settings.gruntDone : null, settings.delayExit !== undefined ? settings.delayExit : false);
      });
    }, function (err) {
      console.error('Unable to create driver', err);
    });
  });

};

module.exports = {
  go: go,
  mode: 'forAuto'
};
