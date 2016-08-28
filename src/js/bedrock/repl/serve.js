var accessor = require('../core/accessor');
/*
 * Settings:
 *
 * projectdir: project directory (what you are testing)
 * basedir: the directory of bedrock
 * runner: runner (e.g. boltroutes, pageroutes etc). Has fallback and routers.
 */
var start = function (settings, f) {
  var Prefs = accessor.create([
    'projectdir',
    'basedir',
    'runner'
  ]);

  var http = require('http');
  var finalhandler = require('finalhandler');

  var openport = require('openport');

  var routes = require('../server/routes');

  var basedir = Prefs.basedir(settings);
  var projectdir = Prefs.projectdir(settings);
  var runner = Prefs.runner(settings);

  var routers = runner.routers;

  var fallback = runner.fallback;

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
