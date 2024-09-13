import { LoggedError, Reporter as ErrorReporter } from '@ephox/bedrock-common';
import { Callbacks, TestReport } from './Callbacks';
import { UrlParams } from '../core/UrlParams';
import { formatElapsedTime, mapStackTrace, setStack } from '../core/Utils';

type LoggedError = LoggedError.LoggedError;

export interface TestReporter {
  readonly start: () => void;
  readonly retry: () => void;
  readonly pass: () => void;
  readonly skip: (reason: string) => void;
  readonly fail: (e: LoggedError) => void;
}

export interface Reporter {
  readonly summary: () => { offset: number; passed: number; failed: number; skipped: number };
  readonly test: (file: string, name: string, totalNumTests: number) => TestReporter;
  readonly waitForResults: () => Promise<void>;
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

  return e;
});

export const Reporter = (params: UrlParams, callbacks: Callbacks, ui: ReporterUi): Reporter => {
  const initial = new Date();
  const initialOffset = params.offset || 0;
  let currentCount = initialOffset;
  let passCount = 0;
  let skipCount = 0;
  let failCount = 0;

  // A list of test results we are going to send as a batch to the server
  const testResults: TestReport[] = [];

  // A global list of requests that were sent to the server, we must wait for these before sending `/done` or it may confuse the HUD
  const requestsInFlight: Promise<void>[] = [];

  const sendCurrentResults = () => {
    if (testResults.length > 0) {
      requestsInFlight.push(callbacks.sendTestResults(params.session, testResults));
      testResults.length = 0;
    }
  };

  const summary = () => ({
    offset: Math.max(0, currentCount - 1),
    passed: passCount + (params.offset - params.failed - params.skipped),
    failed: failCount + params.failed,
    skipped: skipCount + params.skipped
  });

  const test = (file: string, name: string, totalNumTests: number) => {
    let starttime = new Date();
    let reported = false;
    let started = false;
    const testUi = ui.test();

    const start = (): void => {
      if (!started) {
        started = true;
        starttime = new Date();
        currentCount++;

        testUi.start(file, name);

        if (currentCount === initialOffset + 1) {
          // we need to send test start once to establish the session
          const callback = callbacks.sendTestStart(params.session, currentCount, totalNumTests, file, name);
          requestsInFlight.push(callback);
        } else if (starttime.getTime() - initial.getTime() > 30 * 1000) {
          // ping the server with results every 30 seconds or so, otherwise the result data could be gigantic
          sendCurrentResults();
        }
      }
    };

    const retry = (): void => {
      starttime = new Date();
    };

    const pass = (): void => {
      if (!reported) {
        reported = true;
        passCount++;
        const testTime = elapsed(starttime);

        testUi.pass(testTime, currentCount);
        testResults.push({
          file,
          name,
          passed: true,
          time: testTime,
          error: null,
          skipped: null,
        });
      }
    };

    const skip = (reason: string): void => {
      if (!reported) {
        reported = true;
        skipCount++;
        const testTime = elapsed(starttime);

        testUi.skip(testTime, currentCount);

        testResults.push({
          file,
          name,
          passed: false,
          time: testTime,
          error: null,
          skipped: reason,
        });
      }
    };

    const fail = (e: LoggedError): void => {
      if (!reported) {
        reported = true;
        failCount++;

        const testTime = elapsed(starttime);

        // `sourcemapped-stacktrace` is async, so we need to wait for it
        requestsInFlight.push(mapError(e).then((err) => {
          const errorData = ErrorReporter.data(err);
          const error = {
            data: errorData,
            text: ErrorReporter.dataText(errorData)
          };

          testResults.push({
            file,
            name,
            passed: false,
            time: testTime,
            error,
            skipped: null,
          });

          testUi.fail(err, testTime, currentCount);

          sendCurrentResults();
        }));
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

  const waitForResults = (): Promise<void> => {
    sendCurrentResults();
    const currentRequests = requestsInFlight.slice(0);
    requestsInFlight.length = 0;
    Promise.all(currentRequests).then(() => {
      // if more things have been queued, such as a failing test stack trace, wait for those as well
      if (requestsInFlight.length !== 0) {
        return waitForResults();
      }
    });
    return Promise.resolve();
  };

  const done = (error?: LoggedError): void => {
    const setAsDone = (): void => {
      const totalTime = elapsed(initial);
      ui.done(totalTime);
    };

    const textError = error !== undefined ? ErrorReporter.text(error) : undefined;

    // make sure any in progress updates are sent before we clean up
    waitForResults().then(() =>
      callbacks.sendDone(params.session, textError).then(setAsDone, setAsDone)
    );
  };

  return {
    summary,
    test,
    waitForResults,
    done
  };
};
