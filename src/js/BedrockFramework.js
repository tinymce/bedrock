const path = require('path');
const Serve = require('./bedrock/server/Serve');
const Reporter = require('./bedrock/core/Reporter');
const Attempt = require('./bedrock/core/Attempt');
const Version = require('./bedrock/core/Version');
const DriverMaster = require('./bedrock/server/DriverMaster');
const Driver = require('./bedrock/auto/Diver');
const PageRoutes = require('./bedrock/server/PageRoutes');
const Lifecycle = require('./bedrock/core/Lifecycle');

/* eslint-disable no-undef */
const go = function (settings) {
  const master = DriverMaster.create();

  const runner = PageRoutes.generate(settings.projectdir, settings.basedir, settings.page);

  Driver.create({
    browser: settings.browser
  }).then(function (driver) {
    const serveSettings = {
      projectdir: settings.projectdir,
      basedir: settings.basedir,
      driver: Attempt.passed(driver),
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

    Serve.start(serveSettings, function (service, done) {
      if (!isPhantom) console.log('bedrock-framework ' + Version + ' available at: http://localhost:' + service.port);
      const result = driver.get('http://localhost:' + service.port + '/' + settings.page).then(function () {
        const message = isPhantom ? '\nPhantom tests loading ...\n' : '\n ... Initial page has loaded ...';
        console.log(message);
        service.markLoaded();

        return addFramework(settings.framework).then(function () {
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
      });
      Lifecycle.shutdown(result, driver, done, settings.gruntDone !== undefined ? settings.gruntDone : null);
    });
  });
};

module.exports = {
  go: go,
  mode: 'forFramework'
};
