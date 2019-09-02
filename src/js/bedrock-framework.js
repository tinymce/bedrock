const serve = require('./bedrock/server/serve');
const reporter = require('./bedrock/core/reporter');
const attempt = require('./bedrock/core/attempt');
const version = require('./bedrock/core/version');
const drivermaster = require('./bedrock/server/drivermaster');
const path = require('path');
const driver = require('./bedrock/auto/driver');
const pageroutes = require('./bedrock/server/pageroutes');
const lifecycle = require('./bedrock/core/lifecycle');

/* eslint-disable no-undef */
const go = function (settings) {
  const master = drivermaster.create();

  const runner = pageroutes.generate(settings.projectdir, settings.basedir, settings.page);

  driver.create({
    browser: settings.browser
  }).then(function (driver) {
    const serveSettings = {
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

    const addFramework = function (framework) {
      const source = path.join('/page', 'src', 'resources', framework + '-wrapper.js');
      return driver.executeScript(function (src) {
        const script = document.createElement('script');
        script.setAttribute('src', src);
        document.head.appendChild(script);
      }, source);
    };

    const isPhantom = settings.browser === 'phantomjs';

    serve.start(serveSettings, function (service, done) {
      if (!isPhantom) console.log('bedrock-framework ' + version + ' available at: http://localhost:' + service.port);
      const result = driver.get('http://localhost:' + service.port + '/' + settings.page).then(function () {
        const message = isPhantom ? '\nPhantom tests loading ...\n' : '\n ... Initial page has loaded ...';
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
