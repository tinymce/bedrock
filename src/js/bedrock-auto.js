var go = function (settings) {
  var serve = require('./bedrock/server/serve');
  var attempt = require('./bedrock/core/attempt');

  var boltroutes = require('./bedrock/server/boltroutes');

  var poll = require('./bedrock/poll/poll');
  var reporter = require('./bedrock/core/reporter');

  var master = require('./bedrock/server/drivermaster').create();
  var driver = require('./bedrock/auto/driver');

  driver.create({
    browser: settings.browser,
    basedir: settings.basedir
  }).then(function (driver) {
    var lifecycle = require('./bedrock/core/lifecycle');
    var runner = boltroutes.generate(settings.projectdir, settings.basedir, settings.config, settings.testfiles, settings.stopOnFailure);

    var serveSettings = {
      projectdir: settings.projectdir,
      basedir: settings.basedir,
      testfiles: settings.testfiles,
      driver: attempt.passed(driver),
      master: master,
      runner: runner,
      loglevel: settings.loglevel,
      customRoutes: settings.customRoutes
    };

    var isPhantom = settings.browser === 'phantomjs';

    serve.start(serveSettings, function (service, done) {
      if (! isPhantom) console.log('bedrock-auto available at: http://localhost:' + service.port);
      var result = driver.get('http://localhost:' + service.port).then(function () {
        var message = isPhantom ? '\nPhantom tests loading ...\n' : '\n ... Initial page has loaded ...';
        console.log(message);
        service.markLoaded();
        return poll.loop(master, driver, settings).then(function (data) {
          return reporter.write({
            name: settings.name,
            output: settings.output
          })(data);
        }, function (pollExit) {
          var jsonResults = reporter.fakeResults(pollExit.results, pollExit.time);

          return reporter.write({
            name: settings.name,
            output: settings.output
          })(jsonResults).then(function () {
            return Promise.reject(pollExit.message);
          }, function (err) {
            console.error('Error writing report for polling exit condition');
            console.error(err);
            console.error(err.stack);
            return Promise.reject(pollExit.message);
          });
        });
      });
      lifecycle.shutdown(result, driver, done);
    });
  });
};

module.exports = {
  go: go,
  mode: 'forAuto'
};
