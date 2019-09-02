/* eslint-disable no-undef */
var go = function (settings) {
  var serve = require('./bedrock/server/serve');

  var reporter = require('./bedrock/core/reporter');
  var attempt = require('./bedrock/core/attempt');
  var version = require('./bedrock/core/version');

  let drivermaster = require('./bedrock/server/drivermaster');
  var master = drivermaster.create();

  var path = require('path');

  var driver = require('./bedrock/auto/driver');

  var pageroutes = require('./bedrock/server/pageroutes');

  var lifecycle = require('./bedrock/core/lifecycle');

  var runner = pageroutes.generate(settings.projectdir, settings.basedir, settings.page);

  driver.create({
    browser: settings.browser
  }).then(function (driver) {
    var serveSettings = {
      projectdir: settings.projectdir,
      basedir: settings.basedir,
      driver: attempt.passed(driver),
      testfiles: [ ],
      master: master,
      runner: runner,
      loglevel: settings.loglevel,
      customRoutes: settings.customRoutes,
      overallTimeout: settings.overallTimeout,
      singleTimeout: settings.singleTimeout,
      skipResetMousePosition: settings.skipResetMousePosition
    };

    var addFramework = function (framework) {
      var source = path.join('/page', 'src', 'resources', framework + '-wrapper.js');
      return driver.executeScript(function (src) {
        var script = document.createElement('script');
        script.setAttribute('src', src);
        document.head.appendChild(script);
      }, source);
    };

    var isPhantom = settings.browser === 'phantomjs';

    serve.start(serveSettings, function (service, done) {
      if (!isPhantom) console.log('bedrock-framework ' + version + ' available at: http://localhost:' + service.port);
      var result = driver.get('http://localhost:' + service.port + '/' + settings.page).then(function () {
        var message = isPhantom ? '\nPhantom tests loading ...\n' : '\n ... Initial page has loaded ...';
        console.log(message);
        service.markLoaded();

        return addFramework(settings.framework).then(function () {
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
      });
      lifecycle.shutdown(result, driver, done, settings.gruntDone !== undefined ? settings.gruntDone : null);
    });
  });
};

module.exports = {
  go: go,
  mode: 'forFramework'
};
