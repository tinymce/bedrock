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
  var testfiles = Prefs.testfiles(settings);
  var page = Prefs.page(settings);
  var maybeDriver = Prefs.driver(settings);
  var boltConfig = Prefs.config(settings);

  var pageHasLoaded = false;

  var markLoaded = function () {
    pageHasLoaded = true;
  };

  var files = testfiles.map(function (filePath) {
    return path.relative(projectdir, filePath);
  });

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
    routes.routing('/project', projectdir),
    routes.routing('/js', path.join(basedir, 'src/resources')),
    routes.routing('/lib/bolt', path.join(basedir, 'node_modules/@ephox/bolt/lib')),
    routes.routing('/lib/jquery', path.join(basedir, 'node_modules/jquery/dist')),
    routes.routing('/css', path.join(basedir, 'src/css')),
    // Very bolt specific.
    routes.json('/harness', {
      config: path.relative(projectdir, boltConfig),
      scripts: files
    }),
    driverRouter('/keys', 'Keys', keys.executor),
    driverRouter('/mouse', 'Mouse', mouse.executor),
    // Add particular methods.
    routes.effect('/tests/progress', function (data) {
      var totalRun = data.numPassed + data.numFailed;

      // Note, this will remove the previous line if this has not run before, so put a line before the test.
      // Trying to make it only happen for the first run (without using state) was unreliable
      process.stdout.moveCursor(0, -1);
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write('Current test: ' + (data.test !== undefined ? data.test : 'Unknown') + '\n');
      process.stdout.write(
        'Passed: ' + data.numPassed + '/' + data.total +
        ', Failed: ' +data.numFailed + '/' + data.total +
        ' [' + totalRun + ']  ... '
      );
      process.stdout.clearLine(2);
      return Promise.resolve({});
    }),
    routes.effect('/tests/done', function (data) {
      return Promise.resolve({});
    }),
    // This does not need the webdriver.
    routes.effect('/clipboard', clipboard.route(basedir, projectdir))
  ];

  var fallback = routes.constant(basedir, 'src/resources/bedrock.html');

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
      markLoaded: markLoaded,
    }, function () {
      server.close();
    });
  });
};

module.exports = {
  start: start
};
