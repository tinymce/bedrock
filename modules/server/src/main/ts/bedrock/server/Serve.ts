import * as finalhandler from 'finalhandler';
import * as http from 'http';
import * as portfinder from 'portfinder';
import { Browser} from 'webdriverio';
import { Attempt } from '../core/Attempt';
import * as Routes from './Routes';
import * as Apis from './Apis';
import * as CustomRoutes from './CustomRoutes';
import { DriverMaster } from './DriverMaster';
import { TestResults } from './Controller';

interface Server {
  readonly listen: (port: number) => http.Server;
  readonly close: (callback?: () => void) => void;
}

export interface ServeSettings {
  readonly basedir: string;
  readonly customRoutes: string | undefined;
  readonly driver: Attempt<string, Browser<'async'>>;
  readonly loglevel: 'simple' | 'advanced';
  readonly master: DriverMaster | null;
  readonly overallTimeout: number;
  readonly projectdir: string;
  readonly runner: Routes.Runner;
  readonly singleTimeout: number;
  readonly skipResetMousePosition: boolean;
  readonly stickyFirstSession: boolean;
  readonly testfiles: string[];
}

export interface ServeService {
  readonly port: number;
  readonly server: Server;
  readonly markLoaded: () => void;
  readonly enableHud: () => void;
  readonly awaitDone: () => Promise<TestResults>;
  readonly shutdown: () => Promise<void>;
}

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
export const startCustom = (settings: ServeSettings, createServer: (listener: http.RequestListener) => Server): Promise<ServeService> => {

  const pref = <K extends keyof ServeSettings>(f: K): ServeSettings[K] => {
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
  }).catch((err) => {
    return Promise.reject('Error looking for open port between 8000 and 20000: ' + err);
  }).then((port) => {
    const server = createServer((request, response) => {
      const done = finalhandler(request, response);
      Routes.route(routers, fallback, request, response, done);
    }).listen(port);

    return {
      port,
      server,
      markLoaded: api.markLoaded,
      enableHud: api.enableHud,
      awaitDone: api.awaitDone,
      shutdown: () => {
        return new Promise<void>((resolve) => {
          server.close();
          // TODO: Find out why this doesn't shutdown quickly as we may not be closing connections properly
          // For now though give the server 1 sec to shutdown gracefully
          setTimeout(resolve, 1000);
        });
      }
    };
  });
};

export const start = (settings: ServeSettings): Promise<ServeService> => {
  return startCustom(settings, http.createServer);
};
