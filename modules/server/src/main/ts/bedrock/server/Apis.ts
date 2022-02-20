import { Capabilities } from '@wdio/types';
import { Browser } from 'webdriverio';
import { Attempt } from '../core/Attempt';
import * as Coverage from '../core/Coverage';
import * as Waiter from '../util/Waiter';
import * as ClipboardEffects from './ClipboardEffects';
import * as Controller from './Controller';
import { DriverMaster } from './DriverMaster';
import * as KeyEffects from './KeyEffects';
import * as MouseEffects from './MouseEffects';
import * as Routes from './Routes';

type Executor<D, T> = (driver: Browser<'async'>) => (data: D) => Promise<T>;

export interface Apis {
  readonly routers: Routes.Route[];
  readonly markLoaded: () => void;
  readonly enableHud: () => void;
  readonly awaitDone: () => Promise<Controller.TestResults>;
}

interface StartData {
  readonly session: string;
  readonly name: string;
  readonly file: string;
  readonly totalTests: number;
}

interface ResultData extends Controller.TestResult {
  readonly session: string;
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
export const create = (master: DriverMaster | null, maybeDriver: Attempt<any, Browser<'async'>>, projectdir: string, basedir: string, stickyFirstSession: boolean, singleTimeout: number, overallTimeout: number, testfiles: string[], loglevel: 'simple' | 'advanced', resetMousePosition: boolean): Apis => {
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

  const effect = <D>(executor: Executor<D, void>, driver: Browser<'async'>, effectChangesMouse: boolean) => {
    return (data: D) => {
      return waitForDriverReady(maxInvalidAttempts, () => {
        if (effectChangesMouse) {
          needsMousePositionReset = true;
        }
        return executor(driver)(data);
      });
    };
  };

  const resetMousePositionAction = (force = false): Promise<void> => {
    if (resetMousePosition) {
      return Attempt.cata(maybeDriver,
        () => Promise.reject('Resetting mouse position not supported without webdriver running. Use bedrock-auto to get this feature.'),
        (driver) => waitForDriverReady(maxInvalidAttempts, async () => {
          const shouldResetMousePos = force || needsMousePositionReset;
          // TODO re-enable resetting the mouse on other browsers when mouseMove gets fixed on Firefox/IE
          const browserName = (driver.capabilities as Capabilities.Capabilities).browserName;
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

  const markLoaded = () => {
    pageHasLoaded = true;
  };

  const c = Controller.create(stickyFirstSession, singleTimeout, overallTimeout, testfiles, loglevel);

  const routers = [
    driverRouter('/keys', 'Keys', KeyEffects.executor, false),
    driverRouter('/mouse', 'Mouse', MouseEffects.executor, true),
    Routes.effect('POST', '/tests/alive', (data: { session: string }) => {
      c.recordAlive(data.session);
      return Promise.resolve();
    }),
    Routes.effect('POST', '/tests/init', () => resetMousePositionAction(true)),
    Routes.effect('POST', '/tests/start', (data: StartData) => {
      c.recordTestStart(data.session, data.name, data.file, data.totalTests);
      return resetMousePositionAction();
    }),
    Routes.effect('POST', '/tests/result', (data: ResultData) => {
      c.recordTestResult(data.session, data.name, data.file, data.passed, data.time, data.error, data.skipped);
      return Promise.resolve();
    }),
    Routes.effect('POST', '/tests/done', (data: DoneData) => {
      Coverage.writeCoverageData(data.coverage);
      c.recordDone(data.session, data.error);
      return Promise.resolve();
    }),
    // This does not need the webdriver.
    Routes.effect('POST', '/clipboard', ClipboardEffects.route(basedir, projectdir))
  ];

  return {
    routers,
    markLoaded,
    enableHud: c.enableHud,
    awaitDone: c.awaitDone
  };
};
