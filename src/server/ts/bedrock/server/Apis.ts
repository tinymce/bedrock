import { BrowserObject } from 'webdriverio';
import * as KeyEffects from './KeyEffects';
import * as EffectUtils from './EffectUtils';
import * as MouseEffects from './MouseEffects';
import * as ClipboardEffects from './ClipboardEffects';
import * as Routes from './Routes';
import * as Controller from './Controller';
import { Attempt } from '../core/Attempt';
import * as Waiter from '../util/Waiter';
import * as Coverage from '../core/Coverage';
import { DriverMaster } from './DriverMaster';

type Executor<D, T> = (driver: BrowserObject) => (data: D) => Promise<T>;

// This is how long to wait before checking if the driver is ready again
const pollRate = 200;
// This is how many times to fail the driver check before the process fails
const maxInvalidAttempts = 300;

// TODO: Do not use files here.
export const create = (master: DriverMaster, maybeDriver: Attempt<any, BrowserObject>, projectdir: string, basedir: string, stickyFirstSession: boolean, singleTimeout: number, overallTimeout: number, testfiles: string[], loglevel: 'simple' | 'advanced', resetMousePosition: boolean) => {
  let pageHasLoaded = false;

  // On IE, the webdriver seems to load the page before it's ready to start
  // responding to commands. If the testing page itself tries to interact with
  // effects before driver.get has returned properly, it throws "UnsupportedOperationErrors"
  // This code is designed to allow the driver.get promise launched in bedrock-auto to
  // let the server known when it is able to use driver when responding to effect ajax calls.
  const waitForDriverReady = <T>(attempts: number, f: () => Promise<void>): Promise<void> => {
    if (pageHasLoaded && master !== null) return master.waitForIdle(f, 'effect');
    else if (attempts === 0) return Promise.reject('Driver never appeared to be ready');
    else {
      return Waiter.delay({}, pollRate).then(() => {
        return waitForDriverReady(attempts - 1, f);
      });
    }
  };

  const effect = <D>(executor: Executor<D, void>, driver: BrowserObject) => {
    return (data: D) => {
      return waitForDriverReady(maxInvalidAttempts, () => {
        return executor(driver)(data);
      });
    };
  };

  const setInitialMousePosition = (driver: BrowserObject) => {
    return () => {
      // TODO re-enable resetting the mouse on other browsers when mouseMove gets fixed on Firefox/IE
      if (driver.capabilities.browserName === 'chrome') {
        return EffectUtils.getTarget(driver, {selector: '.bedrock-mouse-reset'}).then((target) => {
          return target.moveTo();
        });
      } else {
        return Promise.resolve();
      }
    };
  };

  const driverRouter = <D>(url: string, apiLabel: string, executor: Executor<D, void>) => {
    return Attempt.cata(maybeDriver, () => {
      return Routes.unsupported(
        'POST',
        url,
        apiLabel + ' API not supported without webdriver running. Use bedrock-auto to get this feature.'
      );
    }, (driver) => {
      return Routes.effect('POST', url, effect(executor, driver));
    });
  };

  const markLoaded = () => {
    pageHasLoaded = true;
  };

  const c = Controller.create(stickyFirstSession, singleTimeout, overallTimeout, testfiles, loglevel);

  const routers = [

    driverRouter('/keys', 'Keys', KeyEffects.executor),
    driverRouter('/mouse', 'Mouse', MouseEffects.executor),
    Routes.effect('POST', '/tests/alive', (data: { session: string }) => {
      c.recordAlive(data.session);
      return Promise.resolve();
    }),
    Routes.effect('POST', '/tests/start', (data: { session: string; name: string; file: string; totalTests: number }) => {
      c.recordTestStart(data.session, data.name, data.file, data.totalTests);
      if (resetMousePosition) {
        return Attempt.cata(maybeDriver, () => {
          return Promise.reject('Resetting mouse position not supported without webdriver running. Use bedrock-auto to get this feature.');
        }, (driver) => {
          return effect(setInitialMousePosition, driver)({});
        });
      } else {
        return Promise.resolve();
      }
    }),
    Routes.effect('POST', '/tests/result', (data: Controller.TestResult & { session: string }) => {
      c.recordTestResult(data.session, data.name, data.file, data.passed, data.time, data.error);
      return Promise.resolve();
    }),
    Routes.effect('POST', '/tests/done', (data: { session: string; coverage: Record<string, any> }) => {
      Coverage.writeCoverageData(data.coverage);
      c.recordDone(data.session);
      return Promise.resolve();
    }),
    // This does not need the webdriver.
    Routes.effect('POST', '/clipboard', ClipboardEffects.route(basedir, projectdir))
  ];

  return {
    routers,
    markLoaded: markLoaded,
    enableHud: c.enableHud,
    awaitDone: c.awaitDone
  };
};
