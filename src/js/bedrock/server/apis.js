var keys = require('./keyeffects');
var mouse = require('./mouseeffects');
var clipboard = require('./clipboardeffects');
var routes = require('./routes');
var mController = require('./controller');
var attempt = require('../core/attempt');
var waiter = require('../util/waiter');
var coverage = require('../core/coverage');

// This is how long to wait before checking if the driver is ready again
var pollRate = 2000;
// This is how many times to fail the driver check before the process fails
var maxInvalidAttempts = 300;

// TODO: Do not use files here.
var create = function (master, maybeDriver, projectdir, basedir, stickyFirstSession, singleTimeout, overallTimeout, testfiles, loglevel, resetMousePosition) {

  // On IE, the webdriver seems to load the page before it's ready to start
  // responding to commands. If the testing page itself tries to interact with
  // effects before driver.get has returned properly, it throws "UnsupportedOperationErrors"
  // This code is designed to allow the driver.get promise launched in bedrock-auto to
  // let the server known when it is able to use driver when responding to effect ajax calls.
  var waitForDriverReady = function (attempts, f) {
    if (pageHasLoaded && master !== null) return master.waitForIdle(f, 'effect');
    else if (attempts === 0) return Promise.reject('Driver never appeared to be ready');
    else return waiter.delay({}, pollRate).then(function () {
      return waitForDriverReady(attempts - 1, f);
    });
  };

  var effect = function (executor, driver) {
    return function (data) {
      return waitForDriverReady(maxInvalidAttempts, function () {
        return executor(driver)(data);
      });
    }
  };

  var setInitialMousePosition = function (driver) {
    return function () {
      return driver.getCapabilities().then(function (caps) {
        // TODO re-enable resetting the mouse on other browsers when mouseMove gets fixed on Firefox/IE
        if (caps.get("browserName") === "chrome") {
          return driver.actions().mouseMove({ x: 0, y: 0 }).perform();
        } else {
          return Promise.resolve({});
        }
      });
    };
  };

  var driverRouter = function (url, apiLabel, executor) {
    return attempt.cata(maybeDriver, function () {
      return routes.unsupported(
        'POST',
        url,
        apiLabel + ' API not supported without webdriver running. Use bedrock-auto to get this feature.'
      );
    }, function (driver) {
      return routes.effect('POST', url, effect(executor, driver));
    });
  };


  var pageHasLoaded = false;

  var markLoaded = function () {
    pageHasLoaded = true;
  };

  const controller = mController.create(stickyFirstSession, singleTimeout, overallTimeout, testfiles, loglevel);

  var routers = [

    driverRouter('/keys', 'Keys', keys.executor),
    driverRouter('/mouse', 'Mouse', mouse.executor),
    routes.effect('POST', '/tests/alive', function (data) {
      controller.recordAlive(data.session);
      return Promise.resolve({});
    }),
    routes.effect('POST', '/tests/start', function (data) {
      controller.recordTestStart(data.session, data.name, data.file, data.totalTests);
      if (resetMousePosition) {
        return attempt.cata(maybeDriver, function () {
          return Promise.reject('Resetting mouse position not supported without webdriver running. Use bedrock-auto to get this feature.');
        }, function (driver) {
          return effect(setInitialMousePosition, driver)({});
        });
      } else {
        return Promise.resolve({});
      }
    }),
    routes.effect('POST', '/tests/result', function (data) {
      controller.recordTestResult(data.session, data.name, data.file, data.passed, data.time, data.error);
      return Promise.resolve({});
    }),
    routes.effect('POST', '/tests/done', function (data) {
      coverage.writeCoverageData(data.coverage);
      controller.recordDone(data.session);
      return Promise.resolve({});
    }),
    // This does not need the webdriver.
    routes.effect('POST', '/clipboard', clipboard.route(basedir, projectdir))
  ];

  return {
    routers: routers,
    markLoaded: markLoaded,
    enableHud: controller.enableHud,
    awaitDone: controller.awaitDone
  };
};

module.exports = {
  create: create
};