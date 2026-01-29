import * as finalhandler from 'finalhandler';
import * as http from 'http';
import { Browser} from 'webdriverio';
import { Attempt } from '../core/Attempt';
import * as Routes from './Routes';
import * as Apis from './Apis';
import * as CustomRoutes from './CustomRoutes';
import { DriverMaster } from './DriverMaster';
import { TestResults } from './Controller';

interface Server {
  readonly start: () => Promise<number>;
  readonly stop: () => Promise<void>;
}

export interface ServeSettings {
  readonly basedir: string;
  readonly customRoutes: string | undefined;
  readonly driver: Promise<Attempt<unknown, Browser>>;
  readonly loglevel: 'simple' | 'advanced';
  readonly master: DriverMaster | null;
  readonly overallTimeout: number;
  readonly projectdir: string;
  readonly runner: Promise<Routes.Runner>;
  readonly skipResetMousePosition: boolean;
  readonly stickyFirstSession: boolean;
  readonly testfiles: string[];
  readonly port?: number;
}

export interface ServeService {
  readonly port: number;
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
export const startCustom = async (settings: ServeSettings, createServer: (port: number, listener: http.RequestListener) => Server): Promise<ServeService> => {

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
  const overallTimeout = pref('overallTimeout');
  const resetMousePosition = !pref('skipResetMousePosition');

  const runner = pref('runner');
  const api = Apis.create(master, maybeDriver, projectdir, basedir, stickyFirstSession, overallTimeout, testfiles, settings.loglevel, resetMousePosition);

  // it is important to not use `await` here so the port opens as fast as possible
  const serverRoutes = runner.then(async r => ({
    routers: r.routers.concat(
      await api.routers,
      cr.routers
    ),
    fallback: r.fallback
  }));

  try {
    const port = settings.port ?? 0;

    const server = createServer(port, (request, response) => {
      const done = finalhandler(request, response);
      serverRoutes.then(({ routers, fallback }) => {
        Routes.route(routers, fallback, request, response, done);
      });
    });
    const serverPort = await server.start();

    return {
      port: serverPort,
      markLoaded: api.markLoaded,
      enableHud: api.enableHud,
      awaitDone: api.awaitDone,
      shutdown: server.stop
    };
  } catch (err) {
    return Promise.reject('Error looking for open port between 8000 and 20000: ' + err);
  }
};

export const start = (settings: ServeSettings): Promise<ServeService> => {
  return startCustom(settings, (port, listener) => {
    const server = http.createServer(listener);
    server.requestTimeout = 120000;
    return {
      start: () => {
        return new Promise((resolve, reject) => {
          const onError = (err: any) => {
            server.off('listening', onListening);
            reject(err);
          };
          const onListening = () => {
            server.off('error', onError);
            const addr = server.address();
            if (!addr || typeof addr === 'string') {
              reject(new Error('Unexpected address type'));
            } else {
              resolve(addr.port);
            }
          };
          server.once('error', onError);
          server.once('listening', onListening);
          server.listen(port);
          server.keepAliveTimeout = 120000;
        });
      },
      stop: () => new Promise((resolve, reject) => {
        server.close((err?) => {
          err ? reject(err) : resolve();
        });
      })
    };
  });
};
