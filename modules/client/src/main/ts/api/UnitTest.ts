import { Context, Failure, TestError, TestLabel, TestLogs } from '@ephox/bedrock-common';
import { describe, it } from './Bdd.js';

type TestLogs = TestLogs.TestLogs;
type TestError = TestError.TestError;

export type SuccessCallback = () => void;
export type TestThrowable = TestLabel | TestError;
export type FailureCallback = (error: TestThrowable, logs?: TestLogs) => void;

/** An asynchronous test with callbacks. */
export const asyncTest = (name: string, test: (this: Context, success: SuccessCallback, failure: FailureCallback) => void): void => {
  describe('old-style test', () => {
    it(name, function (done) {
      test.call(this, () => done(), ((err, logs) => {
        const r = Failure.prepFailure(err, logs);
        done(r);
      }));
    });
  });
};

/** Migrate to asyncTest */
export const asynctest = asyncTest;

/** A synchronous test that fails if an exception is thrown */
export const test = (name: string, test: (this: Context) => void): void => {
  describe('old-style test', () => {
    it(name, test);
  });
};

/** Tests an async function (function that returns a Promise). */
export const promiseTest = (name: string, test: (this: Context) => Promise<void>): void => {
  describe('old-style test', () => {
    it(name, test);
  });
};
