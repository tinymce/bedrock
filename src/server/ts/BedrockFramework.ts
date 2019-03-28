import * as path from 'path';
import * as Serve from './bedrock/server/Serve';
import * as Reporter from './bedrock/core/Reporter';
import { Attempt } from './bedrock/core/Attempt';
import * as Version from './bedrock/core/Version';
import * as DriverMaster from './bedrock/server/DriverMaster';
import * as Driver from './bedrock/auto/Driver';
import * as PageRoutes from './bedrock/server/PageRoutes';
import * as Lifecycle from './bedrock/core/Lifecycle';

/* eslint-disable no-undef */
export const go = function (settings) {
  const master = DriverMaster.create();

  const runner = PageRoutes.generate(settings.projectdir, settings.basedir);

  Driver.create({
    browser: settings.browser
  }).then(function (driver) {
    const webdriver = driver.webdriver;
    const serveSettings = {
      projectdir: settings.projectdir,
      basedir: settings.basedir,
      driver: Attempt.passed(webdriver),
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
      return webdriver.execute(function (src) {
        const script = document.createElement('script');
        script.setAttribute('src', src);
        document.head.appendChild(script);
      }, source);
    };

    const isPhantom = settings.browser === 'phantomjs';

    return Serve.start(serveSettings).then(function (service) {
      if (!isPhantom) console.log('bedrock-framework ' + Version.get() + ' available at: http://localhost:' + service.port);
      const result = webdriver.url('http://localhost:' + service.port + '/' + settings.page).then(function () {
        console.log(isPhantom ? '\nPhantom tests loading ...\n' : '\n ... Initial page has loaded ...');
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

      // TODO: where should this setting come from? Is it used?
      const delayExiting = false;
      const gruntDone = settings.gruntDone !== undefined ? settings.gruntDone : null;
      const done = () => Promise.all([ service.shutdown(), driver.shutdown() ]);

      return Lifecycle.shutdown(result, driver, done, gruntDone, delayExiting);
    });
  });
};

export const mode = 'forFramework';
