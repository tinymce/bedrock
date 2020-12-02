import { Failure, Global, TestError } from '@ephox/bedrock-common';
import * as Register from './Register';
import { AsyncFunc, Context, Done, ExclusiveTestFunction, Func, MochaGlobals, PendingTestFunction, Test, TestFunction } from 'mocha';

type TestError = TestError.TestError;

const isTestFunction = (func: TestFunction | PendingTestFunction | ExclusiveTestFunction): func is TestFunction =>
  Object.prototype.hasOwnProperty.call(func, 'only');

const wrapTestFn = <T extends Func | AsyncFunc>(testFn: T): T => {
  // Patch done callback errors
  if (testFn.length > 0) {
    const wrappedFunc = function (this: Context, done: Done) {
      const wrappedDone: Done = function (err?: TestError) {
        done(err === undefined ? undefined : Failure.prepFailure(err));
      };

      return testFn.call(this, wrappedDone);
    } as T;
    wrappedFunc.toString = () => testFn.toString();
    return wrappedFunc;
  // Patch promise errors
  } else {
    const wrappedFunc = function (this: Context) {
      // DefinitelyTyped mocha types are a little wrong, so lets cast to the actual type
      const castTestFn = testFn as (this: Context) => (PromiseLike<any> | void);
      const result = castTestFn.call(this);

      if (result && typeof result.then === 'function') {
        return result.then((value) => value, (error) => {
          throw Failure.prepFailure(error);
        });
      } else {
        return result;
      }
    } as T;
    wrappedFunc.toString = () => testFn.toString();
    return wrappedFunc;
  }
};

const wrapFn = <T extends TestFunction | PendingTestFunction | ExclusiveTestFunction> (func: T): T => {
  const wrappedFn = function (title: string, testFn?: Func | AsyncFunc) {
    const test: Test = func(title, testFn === undefined ? undefined : wrapTestFn(testFn));
    Register.test(test);
    return test;
  } as T;

  const keys = Object.keys(func) as Array<keyof T>;
  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(func, key)) {
      // Wrap only and skip functions as well
      if (isTestFunction(func) && (key === 'only' || key === 'skip')) {
        const funcKey = key as 'only' | 'skip';
        const testFn = func[funcKey];
        (wrappedFn as TestFunction)[funcKey] = wrapFn(testFn);
      } else {
        wrappedFn[key] = func[key];
      }
    }
  });

  return wrappedFn;
};

export const patchMocha = (): void => {
  const mochaGlobals: MochaGlobals = Global;

  // We need to wrap actual test functions, as Mocha only allows an Error to be returned in the done callback
  mochaGlobals.it = wrapFn(mochaGlobals.it);
  mochaGlobals.xit = wrapFn(mochaGlobals.xit);
  mochaGlobals.specify = wrapFn(mochaGlobals.specify);
  mochaGlobals.xspecify = wrapFn(mochaGlobals.xspecify);
};