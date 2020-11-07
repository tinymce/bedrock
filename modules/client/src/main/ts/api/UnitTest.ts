import { TestError, Tests } from '@ephox/bedrock-common';
import * as Failure from '../core/Failure';
import * as Register from '../core/Register';
import { TestLabel } from './TestLabel';
import * as TestLogs from './TestLogs';

type TestLogs = TestLogs.TestLogs;
type TestError = TestError.TestError;

export type SuccessCallback = () => void;
export type TestThrowable = TestLabel | TestError;
export type FailureCallback = (error: TestThrowable, logs?: TestLogs) => void;

const createSuite = (name: string): Tests.Suite => {
  const suite: Tests.Suite = {
    name,
    suites: [],
    tests: []
  };
  Register.suite(suite);
  return suite;
};

/** An asynchronous test with callbacks. */
export const asyncTest = (name: string, fn: (success: SuccessCallback, failure: FailureCallback) => void): void => {
  const suite = createSuite(name);
  const test: Tests.Test = {
    name,
    suite,
    test: (success, failure) => {
      try {
        fn(success, (err: TestThrowable, logs: TestLogs = TestLogs.init()) => {
          const r = Failure.prepFailure(err, logs);
          failure(r);
        });
      } catch (e) {
        const r = Failure.prepFailure(e, TestLogs.init());
        failure(r);
      }
    }
  };

  suite.tests.push(test);
  Register.test(test);
};

/**
 * @deprecated Use asyncTest instead
 **/
export const asynctest = asyncTest;

/** A synchronous test that fails if an exception is thrown */
export const test = (name: string, fn: () => void): void => {
  const suite = createSuite(name);
  const test: Tests.Test = {
    name,
    suite,
    test: (success, failure) => {
      try {
        fn();
        success();
      } catch (e) {
        const r = Failure.prepFailure(e);
        failure(r);
      }
    }
  };

  suite.tests.push(test);
  Register.test(test);
};

/** Tests an async function (function that returns a Promise). */
export const promiseTest = (name: string, test: () => Promise<void>): void =>
  asyncTest(name, (success, failure) => {
    test().then(success).catch(failure);
  });
