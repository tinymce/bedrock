import { LoggedError, TestError } from '@ephox/bedrock-common';
import { prepFailure } from '../core/Failure';
import { register } from '../core/Register';
import { TestLabel } from './TestLabel';
import * as TestLogs from './TestLogs';

type TestLogs = TestLogs.TestLogs;
type TestError = TestError.TestError;
type LoggedError = LoggedError.LoggedError;

export type SuccessCallback = () => void;
export type TestThrowable = TestLabel | TestError;
export type FailureCallback = (error: TestThrowable, logs?: TestLogs) => void;

/** An asynchronous test with callbacks. */
export const asyncTest = (name: string, test: (success: SuccessCallback, failure: FailureCallback) => void) => {
  register(name, function (success: () => void, failure: (e: LoggedError) => void) {
    try {
      test(success, function (err: TestThrowable, logs: TestLogs = TestLogs.init()) {
        const r = prepFailure(err, logs);
        failure(r);
      });
    } catch (e) {
      const r = prepFailure(e, TestLogs.init());
      failure(r);
    }
  });
};

/**
 * @deprecated Use asyncTest instead
 **/
export const asynctest = asyncTest;

/** A synchronous test that fails if an exception is thrown */
export const test = (name: string, test: () => void) => {
  register(name, function (success: () => void, failure: (e: LoggedError) => void) {
    try {
      test();
      success();
    } catch (e) {
      const r = prepFailure(e);
      failure(r);
    }
  });
};

/** Tests an async function (function that returns a Promise). */
export const promiseTest = (name: string, test: () => Promise<void>) =>
  asyncTest(name, (success, failure) => {
    test().then(success).catch(failure);
  });
