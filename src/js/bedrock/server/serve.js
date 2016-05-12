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
  var finalhandler = require('finalhandler');

  var openport = require('openport');

  var routes = require('./routes');
  var keys = require('./keyeffects');

  var routers = [
    routes.routing('/project', settings.projectdir),
    routes.routing('/js', settings.basedir + 'src/resources'),
    routes.routing('/lib/bolt', settings.basedir + 'node_modules/@ephox/bolt/lib'),
    routes.routing('/lib/jquery', settings.basedir + 'node_modules/jquery/dist'),
    routes.routing('/css', settings.basedir + 'src/css'),
    routes.json('/harness', {
      config: settings.config,
      scripts: settings.testfiles
    }),
    settings.driver === null ? routes.unsupported('/keys', 'Keys API not supported without webdriver running. Use bedrock-auto to get this feature.') : routes.effect('/keys', keys.executor(settings.driver))
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
