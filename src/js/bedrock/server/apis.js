var keys = require('./keyeffects');
var mouse = require('./mouseeffects');
var clipboard = require('./clipboardeffects');
var mHud = require('../cli/hud');
var routes = require('./routes');
var attempt = require('../core/attempt');
var waiter = require('../util/waiter');

// This is how long to wait before checking if the driver is ready again
var pollRate = 2000;
// This is how many times to fail the driver check before the process fails
var maxInvalidAttempts = 300;

// TODO: Do not use files here.
var create = function (master, maybeDriver, projectdir, basedir, files, loglevel) {

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

  var driverRouter = function (url, apiLabel, executor) {
    var effect = function (driver) {
      return function (data) {
        return waitForDriverReady(maxInvalidAttempts, function () {
          return executor(driver)(data);
        });
      };
    };

    return attempt.cata(maybeDriver, function () {
      return routes.unsupported(
        'POST',
        url,
        apiLabel + ' API not supported without webdriver running. Use bedrock-auto to get this feature.'
      );
    }, function (driver) {
      return routes.effect('POST', url, effect(driver));
    });
  };

  var pageHasLoaded = false;

  var markLoaded = function () {
    pageHasLoaded = true;
  };

  var hud = mHud.create(files, loglevel);

  var routers = [

    driverRouter('/keys', 'Keys', keys.executor),
    driverRouter('/mouse', 'Mouse', mouse.executor),
    // Update the HUD with current testing process
    routes.effect('POST', '/tests/progress', function (data) {
      return hud.update(data);
    }),
    routes.effect('POST', '/tests/done', function (data) {
      return hud.complete();
    }),
    // This does not need the webdriver.
    routes.effect('POST', '/clipboard', clipboard.route(basedir, projectdir))
  ];

  return {
    routers: routers,
    markLoaded: markLoaded
  };
};

module.exports = {
  create: create
};