import { LoggedError, Reporter as ErrorReporter } from '@ephox/bedrock-common';
import { Callbacks, onSuccessCallback } from './Callbacks';
import { UrlParams } from '../core/UrlParams';
import { formatElapsedTime } from '../core/Utils';

export interface TestReporter {
  start: (onDone: onSuccessCallback) => void;
  pass: (onDone: onSuccessCallback) => void;
  fail: (e: LoggedError.LoggedError, onDone: onSuccessCallback) => void;
}

export interface Reporter {
  summary: () => { offset: number; passed: number; failed: number };
  test: (file: string, name: string, totalNumTests: number) => TestReporter;
  done: () => void;
}

export interface ReporterUi {
  test: () => {
    start: (file: string, name: string) => void;
    pass: (testTime: string, currentCount: number) => void;
    fail: (e: LoggedError.LoggedError, testTime: string, currentCount: number) => void;
  };
  done: (totalTime: string) => void;
}

const elapsed = (since: Date): string => formatElapsedTime(since, new Date());

export const Reporter = (params: UrlParams, callbacks: Callbacks, ui: ReporterUi): Reporter => {
  const initial = new Date();
  let currentCount = params.offset || 0;
  let passCount = 0;
  let failCount = 0;

  const summary = () => ({
    offset: Math.max(0, currentCount - 1),
    passed: passCount + (params.offset - params.failed),
    failed: failCount + params.failed,
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
      callbacks.sendTestResult(params.session, file, name, true, testTime, null, onDone, onDone);
    };

    const fail = (e: LoggedError.LoggedError, onDone: onSuccessCallback): void => {
      if (reported) return;
      reported = true;
      failCount++;

      const textError = ErrorReporter.text(e);
      const testTime = elapsed(starttime);

      testUi.fail(e, testTime, currentCount);
      callbacks.sendTestResult(params.session, file, name, false, testTime, textError, onDone, onDone);
    };

    return {
      start,
      pass,
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