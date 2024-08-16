import { LoggedError, Reporter as ErrorReporter } from '@ephox/bedrock-common';
import { Callbacks } from './Callbacks';
import { UrlParams } from '../core/UrlParams';
import { formatElapsedTime, mapStackTrace, setStack } from '../core/Utils';

type LoggedError = LoggedError.LoggedError;

export interface TestReporter {
  readonly start: () => Promise<void>;
  readonly retry: () => Promise<void>;
  readonly pass: () => Promise<void>;
  readonly skip: (reason: string) => Promise<void>;
  readonly fail: (e: LoggedError) => Promise<void>;
}

export interface Reporter {
  readonly summary: () => { offset: number; passed: number; failed: number; skipped: number };
  readonly test: (file: string, name: string, totalNumTests: number) => TestReporter;
  readonly done: (error?: LoggedError) => void;
}

export interface ReporterUi {
  readonly test: () => {
    readonly start: (file: string, name: string) => void;
    readonly pass: (testTime: string, currentCount: number) => void;
    readonly skip: (testTime: string, currentCount: number) => void;
    readonly fail: (e: LoggedError, testTime: string, currentCount: number) => void;
  };
  readonly done: (totalTime: string) => void;
}

const elapsed = (since: Date): string => formatElapsedTime(since, new Date());

const mapError = (e: LoggedError) => mapStackTrace(e.stack).then((mappedStack) => {
  const originalStack = e.stack;
  setStack(e, mappedStack);

  // Logs may have the stack trace included as well, so ensure we replace that as well
  if (e.logs !== undefined && e.logs.length > 0 && originalStack !== undefined) {
    const logs = e.logs.join('\n');
    e.logs = logs.replace(originalStack, mappedStack).split('\n');
  }

  return Promise.resolve(e);
});

export const Reporter = (params: UrlParams, callbacks: Callbacks, ui: ReporterUi): Reporter => {
  const initial = new Date();
  const initialOffset = params.offset || 0;
  let currentCount = initialOffset;
  let passCount = 0;
  let skipCount = 0;
  let failCount = 0;

  // A global list of reports that were sent to the server, we must wait for these before sending `/done` or it may confuse the HUD
  const reportsInFlight: Promise<void>[] = [];

  const summary = () => ({
    offset: Math.max(0, currentCount - 1),
    passed: passCount + (params.offset - params.failed - params.skipped),
    failed: failCount + params.failed,
    skipped: skipCount + params.skipped
  });

  const test = (file: string, name: string, totalNumTests: number) => {
    let starttime: Date;
    let reported = false;
    let started = false;
    const testUi = ui.test();

    // In order to prevent overloading the browser's parallel connection count, we only send start notifications when necessary.
    // And when we do, we want any subsequent report to be blocked until the start notification has completed.
    let startNotification: () => Promise<void>;

    const start = (): Promise<void> => {
      if (started) {
        return Promise.resolve();
      } else {
        started = true;
        starttime = new Date();
        currentCount++;

        testUi.start(file, name);
        startNotification = () => callbacks.sendTestStart(params.session, currentCount, totalNumTests, file, name);

        // once at test start and again every 50 tests (a number chosen without any particular reason)
        if (currentCount === initialOffset + 1 || currentCount % 50 === 0) {
          // run immediately and cache the result for use later
          const callback = startNotification();
          reportsInFlight.push(callback);
          startNotification = () => callback;
        }
        // don't block, ever ever ever
        return Promise.resolve();
      }
    };

    const retry = (): Promise<void> => {
      starttime = new Date();
      return Promise.resolve();
    };

    const pass = (): Promise<void> => {
      if (reported) {
        return Promise.resolve();
      } else {
        reported = true;
        passCount++;
        const testTime = elapsed(starttime);

        testUi.pass(testTime, currentCount);

        // don't block, ever ever ever
        return Promise.resolve();
      }
    };

    const skip = (reason: string): Promise<void> => {
      if (reported) {
        return Promise.resolve();
      } else {
        reported = true;
        skipCount++;
        const testTime = elapsed(starttime);

        testUi.skip(testTime, currentCount);

        const report = startNotification().then(() =>
           callbacks.sendTestResult(params.session, file, name, false, testTime, null, reason)
        );
        reportsInFlight.push(report);

        // don't block, ever ever ever
        return Promise.resolve();
      }
    };

    const fail = (e: LoggedError): Promise<void> => {
      if (reported) {
        return Promise.resolve();
      } else {
        reported = true;
        failCount++;

        const testTime = elapsed(starttime);
        return mapError(e).then((err) => {
          const errorData = ErrorReporter.data(err);
          const error = {
            data: errorData,
            text: ErrorReporter.dataText(errorData)
          };

          testUi.fail(err, testTime, currentCount);
          // make sure we have sent a `start` before we report a failure, otherwise the HUD goes all weird
          // this can block, because failure data is critical for the console
          return startNotification().then(() =>
            callbacks.sendTestResult(params.session, file, name, false, testTime, error, null)
          );
        });
      }
    };

    return {
      start,
      retry,
      pass,
      skip,
      fail
    };
  };

  const done = (error?: LoggedError): void => {
    const setAsDone = (): void => {
      const totalTime = elapsed(initial);
      ui.done(totalTime);
    };

    const textError = error !== undefined ? ErrorReporter.text(error) : undefined;

    // make sure any in progress updates are sent before we clean up
    Promise.all(reportsInFlight).then(() =>
      callbacks.sendDone(params.session, textError).then(setAsDone, setAsDone)
    );
  };

  return {
    summary,
    test,
    done
  };
};
