import { Browser } from 'webdriverio';
import { Attempt } from '../core/Attempt.js';
import * as Coverage from '../core/Coverage.js';
import * as Waiter from '../util/Waiter.js';
import * as ClipboardEffects from './ClipboardEffects.js';
import * as Controller from './Controller.js';
import { DriverMaster } from './DriverMaster.js';
import * as KeyEffects from './KeyEffects.js';
import * as MouseEffects from './MouseEffects.js';
import * as Routes from './Routes.js';
import {REMOTE_IDLE_TIMEOUT_SECONDS} from '../auto/RemoteDriver.js';

type Executor<D, T> = (driver: Browser) => (data: D) => Promise<T>;

export interface Apis {
  readonly routers: Promise<Routes.Route[]>;
  readonly markLoaded: () => void;
  readonly enableHud: () => void;
  readonly awaitDone: () => Promise<Controller.TestResults>;
}

interface StartData {
  readonly session: string;
  readonly name: string;
  readonly file: string;
  readonly number: number;
  readonly totalTests: number;
}

export interface ResultsData {
  readonly session: string;
  readonly results: Controller.TestResult[];
}

interface DoneData {
  readonly session: string;
  readonly coverage: Record<string, any>;
  readonly error?: string;
}

// This is how long to wait before checking if the driver is ready again
const pollRate = 200;
// This is how many times to fail the driver check before the process fails
const maxInvalidAttempts = 300;

// TODO: Do not use files here.
export const create = (master: DriverMaster | null, pMaybeDriver: Promise<Attempt<unknown, Browser>>, projectdir: string, basedir: string, stickyFirstSession: boolean, overallTimeout: number, testfiles: string[], loglevel: 'simple' | 'advanced', resetMousePosition: boolean): Apis => {
  let pageHasLoaded = false;
  let needsMousePositionReset = true;

  // On IE, the webdriver seems to load the page before it's ready to start
  // responding to commands. If the testing page itself tries to interact with
  // effects before driver.get has returned properly, it throws "UnsupportedOperationErrors"
  // This code is designed to allow the driver.get promise launched in bedrock-auto to
  // let the server known when it is able to use driver when responding to effect ajax calls.
  const waitForDriverReady = async (attempts: number, f: () => Promise<void>): Promise<void> => {
    if (pageHasLoaded && master !== null) {
      return master.waitForIdle(f, 'effect');
    } else if (attempts === 0) {
      return Promise.reject('Driver never appeared to be ready');
    } else {
      await Waiter.delay({}, pollRate);
      return waitForDriverReady(attempts - 1, f);
    }
  };

  const effect = <D>(executor: Executor<D, void>, driver: Browser, effectChangesMouse: boolean) => {
    return (data: D) => {
      return waitForDriverReady(maxInvalidAttempts, () => {
        if (effectChangesMouse) {
          needsMousePositionReset = true;
        }
        return executor(driver)(data);
      });
    };
  };

  const sendKeepAlive = (driver: Browser) => Promise.resolve(void driver.execute(() => console.info('server keep-alive', Date.now())));

  const markLoaded = () => {
    pageHasLoaded = true;
  };

  const c = Controller.create(stickyFirstSession, overallTimeout, testfiles, loglevel);

  const routers = pMaybeDriver.then((maybeDriver) => {

    const keepAliveAction = async () => Attempt.cata(maybeDriver, () => Promise.resolve(),
      (driver) => waitForDriverReady(maxInvalidAttempts, () => sendKeepAlive(driver)));

    const maybeSendKeepAlive: () => Promise<void> = (() => {
      let lastKeepAlive = Date.now();
      /*
       * If we're within a minute of the remote driver timeout, send a keep-alive.
       *
       * In theory this is only required if no other action has been taken in the last x minutes,
       * but this happens so rarely it should be fine.
       */
      const keepAliveTimer = Math.max(120, REMOTE_IDLE_TIMEOUT_SECONDS - 60) * 1000;
      return () => {
        if (Date.now() - lastKeepAlive > keepAliveTimer) {
          lastKeepAlive = Date.now();
          return keepAliveAction();
        } else {
          return Promise.resolve();
        }
      };
    })();

    const resetMousePositionAction = async (force = false): Promise<void> => {
      if (resetMousePosition) {
        return Attempt.cata(maybeDriver,
          () => Promise.reject('Resetting mouse position not supported without webdriver running. Use bedrock-auto to get this feature.'),
          (driver) => waitForDriverReady(maxInvalidAttempts, async () => {
            const shouldResetMousePos = force || needsMousePositionReset;
            // TODO re-enable resetting the mouse on other browsers when mouseMove gets fixed on Firefox/IE
            const browserName = driver.capabilities.browserName;
            if (shouldResetMousePos && (browserName === 'chrome' || browserName === 'msedge')) {
              // Reset the mouse position to the top left of the window
              await driver.performActions([{
                type: 'pointer',
                id: 'finger1',
                parameters: { pointerType: 'mouse' },
                actions: [{ type: 'pointerMove', duration: 0, x: 0, y: 0 }]
              }]);
              needsMousePositionReset = false;
            }
          })
        );
      } else {
        return Promise.resolve();
      }
    };

    const driverRouter = <D>(url: string, apiLabel: string, executor: Executor<D, void>, effectChangesMouse: boolean) => {
      return Attempt.cata(maybeDriver, () => {
        return Routes.unsupported(
          'POST',
          url,
          apiLabel + ' API not supported without webdriver running. Use bedrock-auto to get this feature.'
        );
      }, (driver) => {
        return Routes.effect('POST', url, effect(executor, driver, effectChangesMouse));
      });
    };

    return [
      driverRouter('/keys', 'Keys', KeyEffects.executor, false),
      driverRouter('/mouse', 'Mouse', MouseEffects.executor, true),
      Routes.effect('POST', '/tests/alive', (data: { session: string }) => {
        c.recordAlive(data.session);
        return keepAliveAction();
      }),
      Routes.effect('POST', '/tests/init', () => resetMousePositionAction(true)),
      Routes.effect('POST', '/tests/start', (data: StartData) => {
        c.recordTestStart(data.session, data.name, data.file, data.number, data.totalTests);
        return resetMousePositionAction();
      }),
      Routes.effect('POST', '/tests/results', (data: ResultsData) => {
        c.recordTestResults(data.session, data.results);
        return maybeSendKeepAlive();
      }),
      Routes.effect('POST', '/tests/done', (data: DoneData) => {
        Coverage.writeCoverageData(data.coverage);
        c.recordDone(data.session, data.error);
        return Promise.resolve();
      }),
      // This does not need the webdriver.
      Routes.effect('POST', '/clipboard', ClipboardEffects.route(basedir, projectdir))
    ];
  });

  return {
    routers,
    markLoaded,
    enableHud: c.enableHud,
    awaitDone: c.awaitDone
  };
};
