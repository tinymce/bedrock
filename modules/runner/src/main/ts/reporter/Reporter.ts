import { LoggedError, Reporter as ErrorReporter } from '@ephox/bedrock-common';
import Promise from '@ephox/wrap-promise-polyfill';
import { Callbacks } from './Callbacks';
import { UrlParams } from '../core/UrlParams';
import { formatElapsedTime } from '../core/Utils';

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
  readonly done: () => void;
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

export const Reporter = (params: UrlParams, callbacks: Callbacks, ui: ReporterUi): Reporter => {
  const initial = new Date();
  let currentCount = params.offset || 0;
  let passCount = 0;
  let skipCount = 0;
  let failCount = 0;

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

    const start = (): Promise<void> => {
      if (started) {
        return Promise.resolve();
      } else {
        started = true;
        starttime = new Date();
        currentCount++;

        testUi.start(file, name);
        return callbacks.sendTestStart(params.session, totalNumTests, file, name);
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
        return callbacks.sendTestResult(params.session, file, name, true, testTime, null, null);
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
        return callbacks.sendTestResult(params.session, file, name, false, testTime, null, reason);
      }
    };

    const fail = (e: LoggedError): Promise<void> => {
      if (reported) {
        return Promise.resolve();
      } else {
        reported = true;
        failCount++;

        const textError = ErrorReporter.text(e);
        const testTime = elapsed(starttime);

        testUi.fail(e, testTime, currentCount);
        return callbacks.sendTestResult(params.session, file, name, false, testTime, textError, null);
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

  const done = (): void => {
    const setAsDone = (): void => {
      const totalTime = elapsed(initial);
      ui.done(totalTime);
    };

    callbacks.sendDone(params.session).then(setAsDone, setAsDone);
  };

  return {
    summary,
    test,
    done
  };
};