var accessor = require('../core/accessor');
/*
 * Settings:
 *
 * projectdir: project directory (what you are testing)
 * basedir: the directory of bedrock
 * testfiles: the test files to test (an array)
 * driver: (optional). Required for supporting keys,
 * master (can be null) The driver master (locking and unlocking)
 * runner: runner (e.g. boltroutes, pageroutes etc). Has fallback and routers.
 */
var startCustom = function (settings, createServer, f) {
  var Prefs = accessor.create([
    'projectdir',
    'basedir',
    'testfiles',
    'driver',
    'master',
    'runner',
    'singleTimeout',
    'overallTimeout'
  ]);

  var finalhandler = require('finalhandler');

  var openport = require('openport');

  var routes = require('./routes');
  var apis = require('./apis');
  var customroutes = require('./customroutes').create(settings.customRoutes);

  var basedir = Prefs.basedir(settings);
  var projectdir = Prefs.projectdir(settings);
  var testfiles = Prefs.testfiles(settings);
  var maybeDriver = Prefs.driver(settings);
  var master = Prefs.master(settings);
  var stickyFirstSession = settings.stickyFirstSession;
  var singleTimeout = Prefs.singleTimeout(settings);
  var overallTimeout = Prefs.overallTimeout(settings);

  var runner = Prefs.runner(settings);
  var api = apis.create(master, maybeDriver, projectdir, basedir, stickyFirstSession, singleTimeout, overallTimeout, testfiles, settings.loglevel);

  var routers = runner.routers.concat(
    api.routers,
    customroutes.routers
  );

  var fallback = runner.fallback;

  openport.find({
    startingPort: 8000,
    endingPort: 20000
  }, function (err, port) {
    if (err) {
      console.log('Error looking for open port between 8000 and 20000: ' + err);
      return;
    }

    var server = createServer(function (request, response) {
      var done = finalhandler(request, response);
      routes.route(routers, fallback, request, response, done);
    }).listen(port);

    f({
      port: port,
      server: server,
      markLoaded: api.markLoaded,
      awaitDone: api.awaitDone
    }, function () {
      server.close();
    });
  });
};

var start = function (settings, f) {
  var http = require('http');
  startCustom(settings, http.createServer, f);
};

module.exports = {
  startCustom: startCustom,
  start: start
};
