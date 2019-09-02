const finalhandler = require('finalhandler');
const portfinder = require('portfinder');
const Accessor = require('../core/Accessor');
const Routes = require('./Routes');
const Apis = require('./Apis');
const CustomRoutes = require('./CustomRoutes');

/*
 * Settings:
 *
 * projectdir: project directory (what you are testing)
 * basedir: the directory of bedrock
 * testfiles: the test files to test (an array)
 * driver: (optional). Required for supporting keys,
 * master (can be null) The driver master (locking and unlocking)
 * runner: runner (e.g. runnerroutes, pageroutes etc). Has fallback and routers.
 */
const startCustom = function (settings, createServer, f) {
  const Prefs = Accessor.create([
    'projectdir',
    'basedir',
    'testfiles',
    'driver',
    'master',
    'runner',
    'singleTimeout',
    'overallTimeout',
    'skipResetMousePosition'
  ]);

  const cr = CustomRoutes.create(settings.customRoutes);

  const basedir = Prefs.basedir(settings);
  const projectdir = Prefs.projectdir(settings);
  const testfiles = Prefs.testfiles(settings);
  const maybeDriver = Prefs.driver(settings);
  const master = Prefs.master(settings);
  const stickyFirstSession = settings.stickyFirstSession;
  const singleTimeout = Prefs.singleTimeout(settings);
  const overallTimeout = Prefs.overallTimeout(settings);
  const resetMousePosition = !Prefs.skipResetMousePosition(settings);

  const runner = Prefs.runner(settings);
  const api = Apis.create(master, maybeDriver, projectdir, basedir, stickyFirstSession, singleTimeout, overallTimeout, testfiles, settings.loglevel, resetMousePosition);

  const routers = runner.routers.concat(
    api.routers,
    cr.routers
  );

  const fallback = runner.fallback;

  portfinder.getPort({
    port: 8000,
    stopPort: 20000
  }, function (err, port) {
    if (err) {
      console.log('Error looking for open port between 8000 and 20000: ' + err);
      return;
    }

    const server = createServer(function (request, response) {
      const done = finalhandler(request, response);
      Routes.route(routers, fallback, request, response, done);
    }).listen(port);

    f({
      port: port,
      server: server,
      markLoaded: api.markLoaded,
      enableHud: api.enableHud,
      awaitDone: api.awaitDone
    }, function () {
      server.close();
    });
  });
};

const start = function (settings, f) {
  const http = require('http');
  startCustom(settings, http.createServer, f);
};

module.exports = {
  startCustom: startCustom,
  start: start
};
