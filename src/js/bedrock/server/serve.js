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

  var openport = require('openport');

  var routes = require('./routes');
  var keys = require('./keyeffects');
  var mouse = require('./mouseeffects');
  var clipboard = require('./clipboardeffects');

  var testFiles = settings.testfiles.map(function (filePath) {
    return path.relative(settings.projectdir, filePath);
  });

  var driverRouter = function (url, apiLabel, executor) {
    var unsupported = routes.unsupported(
      url,
      apiLabel + ' API not supported without webdriver running. Use bedrock-auto to get this feature.'
    );
    return settings.driver === null ? unsupported : routes.effect(url, executor(settings.driver));
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
      server: server
    }, function () {
      server.close();
    });
  });
};

module.exports = {
  start: start
};
