var accessor = require('../core/accessor');
/*
 * Settings:
 *
 * projectdir: project directory (what you are testing)
 * basedir: the directory of bedrock
 * config: the name of the config file
 * testfiles: the test files to test (an array)
 * driver: (optional). Required for supporting keys
 */
var start = function (settings, f) {
  var Prefs = accessor.create([
    'projectdir',
    'basedir',
    'config',
    'testfiles',
    'driver',
    'master',
    'page'
  ]);

  var http = require('http');
  var path = require('path');
  var finalhandler = require('finalhandler');
  var waiter = require('../util/waiter');

  var openport = require('openport');

  var routes = require('./routes');
  var keys = require('./keyeffects');
  var mouse = require('./mouseeffects');
  var clipboard = require('./clipboardeffects');
  var attempt = require('../core/attempt');

  // This is how long to wait before checking if the driver is ready again
  var pollRate = 2000;
  // This is how many times to fail the driver check before the process fails
  var maxInvalidAttempts = 300;

  // This is a drivermaster. It represents access to the webdriver. It provides
  // basic locking and unlocking. All promise chains that require webdriver should
  // use the waitForIdle method. Although webdrivers should be sequencing their
  // script calls by themselves, IE frequently interleaved them. Not sure why.
  var master = Prefs.master(settings);

  var basedir = Prefs.basedir(settings);
  var projectdir = Prefs.projectdir(settings);
  var page = Prefs.page(settings);
  var maybeDriver = Prefs.driver(settings);

  var pageHasLoaded = false;

  var markLoaded = function () {
    pageHasLoaded = true;
  };

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
        url,
        apiLabel + ' API not supported without webdriver running. Use bedrock-auto to get this feature.'
      );
    }, function (driver) {
      return routes.effect(url, effect(driver));
    });
  };

  var routers = [
    driverRouter('/keys', 'Keys', keys.executor),
    driverRouter('/mouse', 'Mouse', mouse.executor),
    // This does not need the webdriver.
    routes.effect('/clipboard', clipboard.route(basedir, projectdir)),
    routes.hostOn('/page', basedir)

  ];

console.log('page', page);
  var fallback = routes.host(projectdir, page);

  openport.find({
    startingPort: 8000,
    endingPort: 20000
  }, function (err, port) {
    if (err) {
      console.log('Error looking for open port between 8000 and 20000: ' + err);
      return;
    }

    var server = http.createServer(function (request, response) {
      var done = finalhandler(request, response);
      routes.route(routers, fallback, request, response, done);
    }).listen(port);

    f({
      port: port,
      server: server,
      markLoaded: markLoaded
    }, function () {
      server.close();
    });
  });
};

module.exports = {
  start: start
};
