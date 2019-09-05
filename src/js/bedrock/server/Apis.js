const KeyEffects = require('./KeyEffects');
const MouseEffects = require('./MouseEffects');
const EffectUtils = require('./EffectUtils');
const ClipboardEffects = require('./ClipboardEffects');
const Routes = require('./Routes');
const Controller = require('./Controller');
const Attempt = require('../core/Attempt');
const Waiter = require('../util/Waiter');
const Coverage = require('../core/Coverage');

// This is how long to wait before checking if the driver is ready again
const pollRate = 2000;
// This is how many times to fail the driver check before the process fails
const maxInvalidAttempts = 300;

// TODO: Do not use files here.
const create = function (master, maybeDriver, projectdir, basedir, stickyFirstSession, singleTimeout, overallTimeout, testfiles, loglevel, resetMousePosition) {
  // On IE, the webdriver seems to load the page before it's ready to start
  // responding to commands. If the testing page itself tries to interact with
  // effects before driver.get has returned properly, it throws "UnsupportedOperationErrors"
  // This code is designed to allow the driver.get promise launched in bedrock-auto to
  // let the server known when it is able to use driver when responding to effect ajax calls.
  const waitForDriverReady = function (attempts, f) {
    if (pageHasLoaded && master !== null) return master.waitForIdle(f, 'effect');
    else if (attempts === 0) return Promise.reject('Driver never appeared to be ready');
    else {
      return Waiter.delay({}, pollRate).then(function () {
        return waitForDriverReady(attempts - 1, f);
      });
    }
  };

  const effect = function (executor, driver) {
    return function (data) {
      return waitForDriverReady(maxInvalidAttempts, function () {
        return executor(driver)(data);
      });
    };
  };

  const setInitialMousePosition = function (driver) {
    return function () {
      return driver.getCapabilities().then(function (caps) {
        // TODO re-enable resetting the mouse on other browsers when mouseMove gets fixed on Firefox/IE
        if (caps.get('browserName') === 'chrome') {
          return EffectUtils.getTarget(driver, {selector: '#bedrock-mouse-reset'}).then(function (tgt) {
            return driver.actions().mouseMove(tgt).perform();
          });
        } else {
          return Promise.resolve({});
        }
      });
    };
  };

  const driverRouter = function (url, apiLabel, executor) {
    return Attempt.cata(maybeDriver, function () {
      return Routes.unsupported(
        'POST',
        url,
        apiLabel + ' API not supported without webdriver running. Use bedrock-auto to get this feature.'
      );
    }, function (driver) {
      return Routes.effect('POST', url, effect(executor, driver));
    });
  };


  let pageHasLoaded = false;

  const markLoaded = function () {
    pageHasLoaded = true;
  };

  const c = Controller.create(stickyFirstSession, singleTimeout, overallTimeout, testfiles, loglevel);

  const routers = [

    driverRouter('/keys', 'Keys', KeyEffects.executor),
    driverRouter('/mouse', 'Mouse', MouseEffects.executor),
    Routes.effect('POST', '/tests/alive', function (data) {
      c.recordAlive(data.session);
      return Promise.resolve({});
    }),
    Routes.effect('POST', '/tests/start', function (data) {
      c.recordTestStart(data.session, data.name, data.file, data.totalTests);
      if (resetMousePosition) {
        return Attempt.cata(maybeDriver, function () {
          return Promise.reject('Resetting mouse position not supported without webdriver running. Use bedrock-auto to get this feature.');
        }, function (driver) {
          return effect(setInitialMousePosition, driver)({});
        });
      } else {
        return Promise.resolve({});
      }
    }),
    Routes.effect('POST', '/tests/result', function (data) {
      c.recordTestResult(data.session, data.name, data.file, data.passed, data.time, data.error);
      return Promise.resolve({});
    }),
    Routes.effect('POST', '/tests/done', function (data) {
      Coverage.writeCoverageData(data.coverage);
      c.recordDone(data.session);
      return Promise.resolve({});
    }),
    // This does not need the webdriver.
    Routes.effect('POST', '/clipboard', ClipboardEffects.route(basedir, projectdir))
  ];

  return {
    routers: routers,
    markLoaded: markLoaded,
    enableHud: c.enableHud,
    awaitDone: c.awaitDone
  };
};

module.exports = {
  create: create
};
