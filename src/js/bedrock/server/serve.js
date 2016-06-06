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
  var http = require('http');
  var path = require('path');
  var finalhandler = require('finalhandler');
  var waiter = require('../util/waiter.js');

  // This is a drivermaster. It represents access to the webdriver. It provides
  // basic locking and unlocking. All promise chains that require webdriver should
  // use the waitForIdle method.
  var master = settings.master;

  var pageHasLoaded = false;

  var markLoaded = function () {
    pageHasLoaded = true;
  };

  var openport = require('openport');

  var routes = require('./routes');
  var keys = require('./keyeffects');
  var mouse = require('./mouseeffects');
  var clipboard = require('./clipboardeffects');

  var testFiles = settings.testfiles.map(function (filePath) {
    return path.relative(settings.projectdir, filePath);
  });

  var waitForDriverReady = function (attempts, f) {
    return master.waitForIdle(f, 'effect');
    // IE throws errors when functions are used before the driver is ready.
    if (pageHasLoaded) return master.waitForIdle(f, 'effect');
    else if (attempts === 0) return Promise.reject('Driver never appeared to be ready');
    else return waiter.delay({}, 2000).then(function () {
      return waitForDriverReady(attempts - 1, f);
    });
  };

  var driverRouter = function (url, apiLabel, executor) {
    var unsupported = routes.unsupported(
      url,
      apiLabel + ' API not supported without webdriver running. Use bedrock-auto to get this feature.'
    );
    var effect = function (data) {
      return waitForDriverReady(300, function () {
        return executor(settings.driver)(data);
      });
    };
    return settings.driver === null ? unsupported : routes.effect(url, effect);
  };

  var routers = [
    routes.routing('/project', settings.projectdir),
    routes.routing('/js', path.join(settings.basedir, 'src/resources')),
    routes.routing('/lib/bolt', path.join(settings.basedir, 'node_modules/@ephox/bolt/lib')),
    routes.routing('/lib/jquery', path.join(settings.basedir, 'node_modules/jquery/dist')),
    routes.routing('/css', path.join(settings.basedir, 'src/css')),
    routes.json('/harness', {
      config: path.relative(settings.projectdir, settings.config),
      scripts: testFiles
    }),
    driverRouter('/keys', 'Keys', keys.executor),
    driverRouter('/mouse', 'Mouse', mouse.executor),
    routes.effect('/clipboard', clipboard.route(settings.basedir, settings.projectdir))
  ];

  var fallback = routes.constant(settings.basedir, 'src/resources/bedrock.html');

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
