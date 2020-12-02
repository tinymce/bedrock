import { LoggedError, Reporter as ErrorReporter } from '@ephox/bedrock-common';
import { Callbacks, onSuccessCallback } from './Callbacks';
import { UrlParams } from '../core/UrlParams';
import { formatElapsedTime } from '../core/Utils';

export interface TestReporter {
  readonly start: (onDone: onSuccessCallback) => void;
  readonly pass: (onDone: onSuccessCallback) => void;
  readonly skip: (reason: string, onDone: onSuccessCallback) => void;
  readonly fail: (e: LoggedError.LoggedError, onDone: onSuccessCallback) => void;
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
    readonly fail: (e: LoggedError.LoggedError, testTime: string, currentCount: number) => void;
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
    let reported: boolean;
    const testUi = ui.test();

    const start = (onDone: onSuccessCallback): void => {
      starttime = new Date();
      currentCount++;

      reported = false;
      testUi.start(file, name);
      callbacks.sendTestStart(params.session, totalNumTests, file, name, onDone, onDone);
    };

    const pass = (onDone: onSuccessCallback): void => {
      if (reported) return;
      reported = true;
      passCount++;
      const testTime = elapsed(starttime);

      testUi.pass(testTime, currentCount);
      callbacks.sendTestResult(params.session, file, name, true, testTime, null, null, onDone, onDone);
    };

    const skip = (reason: string, onDone: onSuccessCallback): void => {
      if (reported) return;
      reported = true;
      skipCount++;
      const testTime = elapsed(starttime);

      testUi.skip(testTime, currentCount);
      callbacks.sendTestResult(params.session, file, name, false, testTime, null, reason, onDone, onDone);
    };

    const fail = (e: LoggedError.LoggedError, onDone: onSuccessCallback): void => {
      if (reported) return;
      reported = true;
      failCount++;

      const textError = ErrorReporter.text(e);
      const testTime = elapsed(starttime);

      testUi.fail(e, testTime, currentCount);
      callbacks.sendTestResult(params.session, file, name, false, testTime, textError, null, onDone, onDone);
    };

    return {
      start,
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

    callbacks.sendDone(params.session, setAsDone, setAsDone);
  };

  return {
    summary,
    test,
    done
  };
};