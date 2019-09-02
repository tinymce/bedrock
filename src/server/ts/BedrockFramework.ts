import * as path from 'path';
import * as Serve from './bedrock/server/Serve';
import * as Reporter from './bedrock/core/Reporter';
import * as Attempt from './bedrock/core/Attempt';
import * as Version from './bedrock/core/Version';
import * as DriverMaster from './bedrock/server/DriverMaster';
import * as Driver from './bedrock/auto/Diver';
import * as PageRoutes from './bedrock/server/PageRoutes';
import * as Lifecycle from './bedrock/core/Lifecycle';

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
      testfiles: [],
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
