import { Hook, TestError, Tests } from '@ephox/bedrock-common';
import * as Failure from '../core/Failure';
import * as Register from '../core/Register';
import { TestLabel } from './TestLabel';
import * as TestLogs from './TestLogs';

type TestLogs = TestLogs.TestLogs;
type TestLogEntry = TestLogs.TestLogEntry;
type TestError = TestError.TestError;

export type TestThrowable = TestLabel | TestError;

type ExecuteFn = (done: (err?: TestThrowable) => void) => void | Promise<any>;

interface Test extends Tests.Test {
  readonly context: Context;
}

interface Suite extends Tests.Suite {
  readonly hooks: Record<Hook, Tests.RunFn[]>;
  readonly parent?: Suite;
  readonly context: Context;
}

interface Context {
  readonly log: TestLogEntry;
}

const suiteStack: Suite[] = [];

const getCurrentSuite = (): Suite | undefined =>
  suiteStack.length > 0 ? suiteStack[suiteStack.length - 1] : undefined;

const getCurrentSuiteOrDie = (): Suite => {
  const currentSuite = getCurrentSuite();
  if (currentSuite === undefined) {
    throw new Error('Failed to find a current test suite');
  } else {
    return currentSuite;
  }
};

const createContext = (name: string, suite?: Suite): Context => ({
  log: suite === undefined ? TestLogs.createLogEntry(name) : TestLogs.addLogEntry(suite.context.log, name)
});

const createSuite = (name: string, current?: Suite): Suite => {
  return {
    name: current === undefined ? name : `${current.name} / ${name}`,
    hooks: {
      [Hook.Before]: [],
      [Hook.BeforeEach]: [],
      [Hook.After]: [],
      [Hook.AfterEach]: [],
    },
    suites: [],
    tests: [],
    parent: current,
    context: createContext(name, current)
  };
};

const createTestLog = (suite: Suite): TestLogs => {
  let currentSuite = suite;
  while (currentSuite.parent !== undefined) {
    currentSuite = currentSuite.parent;
  }
  return {
    history: [ currentSuite.context.log ]
  };
};

const run = (fn: ExecuteFn, success: () => void, failure: (e: TestThrowable) => void) => {
  const retValue = fn((err?: TestThrowable) => {
    if (err !== undefined) {
      failure(err);
    } else {
      success();
    }
  });

  // If the function has 1 or more arguments, it's using the async callback
  if (fn.length == 0) {
    // Promise based return value
    if (retValue !== undefined && retValue.then !== undefined) {
      retValue.then(success, failure);
    } else {
      success();
    }
  }
};

const wrapFn = (suite: Suite, fn: ExecuteFn, log?: TestLogEntry): Tests.RunFn => (success, failure) => {
  const fail = (err: TestThrowable) => {
    TestLogs.addStackTrace(log || suite.context.log, Failure.normalizeError(err));
    const r = Failure.prepFailure(err, createTestLog(suite));
    failure(r);
  };

  try {
    run(fn, success, fail);
  } catch (e) {
    fail(e);
  }
};

export const describe = (name: string, fn: () => void): void => {
  const current = getCurrentSuite();
  const suite = createSuite(name, current);
  if (current !== undefined) {
    current.suites.push(suite);
  } else {
    Register.suite(suite);
  }

  suiteStack.push(suite);
  fn();
  suiteStack.pop();
};
export const context = describe;

export const before = (fn: ExecuteFn): void => {
  const suite = getCurrentSuiteOrDie();
  suite.hooks[Hook.Before].push(wrapFn(suite, fn));
};

export const beforeEach = (fn: ExecuteFn): void => {
  const suite = getCurrentSuiteOrDie();
  suite.hooks[Hook.BeforeEach].push(wrapFn(suite, fn));
};

export const after = (fn: ExecuteFn): void => {
  const suite = getCurrentSuiteOrDie();
  suite.hooks[Hook.After].push(wrapFn(suite, fn));
};

export const afterEach = (fn: ExecuteFn): void => {
  const suite = getCurrentSuiteOrDie();
  suite.hooks[Hook.AfterEach].push(wrapFn(suite, fn));
};

export const it = (name: string, fn: ExecuteFn): void => {
  const suite = getCurrentSuiteOrDie();
  const log = TestLogs.addLogEntry(suite.context.log, name);
  const test: Test = {
    name: suite.name + ' ' + name,
    suite,
    test: wrapFn(suite, fn, log),
    context: {
      log
    }
  };

  suite.tests.push(test);
  Register.test(test);
};
export const specify = it;
