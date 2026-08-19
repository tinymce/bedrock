import { LoggedError, Reporter as ErrorReporter } from '@ephox/bedrock-common';
import { Callbacks, TestReport } from './Callbacks';
import { MouseWatch } from '../core/MouseWatch';
import { UrlParams } from '../core/UrlParams';
import { formatElapsedTime, mapStackTrace, setStack } from '../core/Utils';

type LoggedError = LoggedError.LoggedError;

export interface TestReporter {
  readonly start: () => Promise<void>;
  readonly retry: () => void;
  readonly pass: () => void;
  readonly skip: (reason: string) => void;
  readonly fail: (e: LoggedError) => void;
}

export interface Reporter {
  readonly summary: () => { offset: number; passed: number; failed: number; skipped: number };
  readonly test: (file: string, name: string, totalNumTests: number) => TestReporter;
  readonly strayFailure: (file: string, name: string, e: LoggedError) => void;
  readonly waitForResults: () => Promise<void>;
  readonly retry: () => Promise<void>;
  readonly done: (error?: LoggedError) => void;
}

export interface ReporterUi {
  readonly test: () => {
    readonly start: (file: string, name: string) => void;
    readonly pass: (testTime: string, currentCount: number) => void;
    readonly skip: (testTime: string, currentCount: number) => void;
    readonly fail: (e: LoggedError, testTime: string, currentCount: number) => void;
  };
  readonly error: (e: LoggedError) => void;
  readonly done: (totalTime: string) => void;
}

const elapsed = (since: number): string => formatElapsedTime(since, Date.now());

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

export const Reporter = (params: UrlParams, callbacks: Callbacks, ui: ReporterUi, mouse: MouseWatch): Reporter => {
  const initial = Date.now();
  let timeOfLastReport = initial;
  let currentCount = params.offset || 0;
  let passCount = 0;
  let skipCount = 0;
  let failCount = 0;
  let finished = false;

  // A list of test results we are going to send as a batch to the server
  const testResults: TestReport[] = [];

  // A global list of requests that were sent to the server, we must wait for these before sending `/done` or it may confuse the HUD
  const requestsInFlight: Promise<void>[] = [];

  const forceReportResults = (): void => {
    if (testResults.length > 0) {
      requestsInFlight.push(callbacks.sendTestResults(params.session, testResults));
      testResults.length = 0;
    }
  };

  const reportResult = (result: TestReport): void => {
    testResults.push(result);
    if (Date.now() - timeOfLastReport > 30 * 1000) {
      // ping the server with results every 30 seconds or so, as a form of keep-alive
      forceReportResults();
      timeOfLastReport = Date.now();
    }
  };

  const reportFailure = (file: string, name: string, testTime: string, e: LoggedError, onReported: (err: LoggedError) => void): void => {
    failCount++;

    // `sourcemapped-stacktrace` is async, so we need to wait for it
    requestsInFlight.push(mapError(e).then((err) => {
      const errorData = ErrorReporter.data(err);
      const error = {
        data: errorData,
        text: ErrorReporter.dataText(errorData)
      };

      reportResult({
        file,
        name,
        passed: false,
        time: testTime,
        error,
        skipped: null,
      });

      onReported(err);
    }));
  };

  const summary = () => ({
    offset: Math.max(0, currentCount - 1),
    passed: passCount + (params.offset - params.failed - params.skipped),
    failed: failCount + params.failed,
    skipped: skipCount + params.skipped
  });

  const test = (file: string, name: string, totalNumTests: number) => {
    let starttime = Date.now();
    let reported = false;
    let started = false;
    const testUi = ui.test();

    const sendStart = (): Promise<void> => {
      if (currentCount === 1) {
        // we need to send test start once to establish the session
        requestsInFlight.push(callbacks.sendTestStart(params.session, currentCount, totalNumTests, file, name));
        return Promise.resolve();
      } else if (mouse.hasMoved()) {
        // Send a new test start so the server resets the mouse - and wait for it
        return callbacks.sendTestStart(params.session, currentCount, totalNumTests, file, name).then(() => {
          mouse.clear();
        }, (e) => {
          // ignore, will try again later (because `mouse.clear()` hasn't run)
          console.error('Failed to reset the mouse position', e);
        });
      } else {
        return Promise.resolve();
      }
    };

    const start = (): Promise<void> => {
      if (!started) {
        started = true;
        currentCount++;

        testUi.start(file, name);

        // remove mouse reset time from test records
        return sendStart().then(() => {
          starttime = Date.now();
        });
      } else {
        return Promise.resolve();
      }
    };

    const retry = (): void => {
      // a test has used `this.retries()` and wants to retry without reloading the page
      starttime = Date.now();
    };

    const pass = (): void => {
      if (!reported) {
        reported = true;
        passCount++;
        const testTime = elapsed(starttime);

        testUi.pass(testTime, currentCount);
        reportResult({
          file,
          name,
          passed: true,
          time: testTime,
          error: null,
          skipped: null,
        });
        if (params.retry > 0) {
          // a test that was under reload/retry status has now passed.
          // this needs to be reported immediately, otherwise we might bump up against server timeouts.
          forceReportResults();
        }
      }
    };

    const skip = (reason: string): void => {
      if (!reported) {
        reported = true;
        skipCount++;
        const testTime = elapsed(starttime);

        testUi.skip(testTime, currentCount);

        reportResult({
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
        const testTime = elapsed(starttime);
        reportFailure(file, name, testTime, e, (err) => testUi.fail(err, testTime, currentCount));
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

  // An error that arrives outside of a test is attributed to whichever test ran most recently, which
  // replaces that test's result on the server. It deliberately doesn't advance the test count - the
  // run is still going, and moving the count on would make the next page load skip a test.
  const strayFailure = (file: string, name: string, e: LoggedError): void => {
    // once the run is over there's nothing left to attribute this to, and sending more results would
    // reopen the session on the server
    if (finished) {
      ui.error(e);
    } else {
      reportFailure(file, name, elapsed(Date.now()), e, (err) => {
        ui.error(err);
        // nothing is waiting on this result and the page may be about to reload, so send it now
        forceReportResults();
      });
    }
  };

  const waitForResults = async (): Promise<void> => {
    forceReportResults();
    if (requestsInFlight.length > 0) {
      const currentRequests = requestsInFlight.slice(0);
      requestsInFlight.length = 0;
      await Promise.all(currentRequests);
      // if more things have been queued, such as a failing test stack trace, wait for those as well
      await waitForResults();
    }
  };

  // the page is about to reload to retry a test
  const retry = (): Promise<void> => {
    // remove the last test failure from the stack so we don't confuse the server
    const last = testResults.pop();
    if (last && last.error === null) {
      // something isn't right, the last test didn't fail, put it back
      testResults.push(last);
    }
    return waitForResults();
  };

  const done = (error?: LoggedError): void => {
    finished = true;
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
    strayFailure,
    retry,
    waitForResults,
    done
  };
};
