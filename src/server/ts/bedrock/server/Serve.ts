import * as finalhandler from 'finalhandler';
import * as portfinder from 'portfinder';
import * as Routes from './Routes';
import * as Apis from './Apis';
import * as CustomRoutes from './CustomRoutes';
import * as http from 'http';

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
export const startCustom = function (settings, createServer) {

  const pref = (f: string): any => {
    const v = settings[f];
    if (v === undefined) {
      throw new Error('Object: does not have field: ' + f);
    }
    return v;
  };

  const cr = CustomRoutes.create(settings.customRoutes);

  const basedir = pref('basedir');
  const projectdir = pref('projectdir');
  const testfiles = pref('testfiles');
  const maybeDriver = pref('driver');
  const master = pref('master');
  const stickyFirstSession = settings.stickyFirstSession;
  const singleTimeout = pref('singleTimeout');
  const overallTimeout = pref('overallTimeout');
  const resetMousePosition = !pref('skipResetMousePosition');

  const runner = pref('runner');
  const api = Apis.create(master, maybeDriver, projectdir, basedir, stickyFirstSession, singleTimeout, overallTimeout, testfiles, settings.loglevel, resetMousePosition);

  const routers = runner.routers.concat(
    api.routers,
    cr.routers
  );

  const fallback = runner.fallback;

  return portfinder.getPortPromise({
    port: 8000,
    stopPort: 20000
  }).then(function (port) {
    const server = createServer(function (request, response) {
      const done = finalhandler(request, response);
      Routes.route(routers, fallback, request, response, done);
    }).listen(port);

    return {
      port: port,
      server: server,
      markLoaded: api.markLoaded,
      enableHud: api.enableHud,
      awaitDone: api.awaitDone,
      shutdown: function () {
        return new Promise(function (resolve) {
          server.close();
          // TODO: Find out why this doesn't shutdown quickly as we may not be closing connections properly
          // For now though give the server 1 sec to shutdown gracefully
          setTimeout(resolve, 1000);
        });
      }
    };
  }).catch(function (err) {
    return Promise.reject('Error looking for open port between 8000 and 20000: ' + err);
  });
};

export const start = function (settings) {
  return startCustom(settings, http.createServer);
};
