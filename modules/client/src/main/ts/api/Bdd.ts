import { TestError } from '@ephox/bedrock-common';
import * as Failure from '../core/Failure';
import * as Register from '../core/Register';
import { TestLabel } from './TestLabel';
import * as TestLogs from './TestLogs';

type TestLogs = TestLogs.TestLogs;
type TestLogEntry = TestLogs.TestLogEntry;
type TestError = TestError.TestError;

export type TestThrowable = TestLabel | TestError;

type TestFn = (done?: (err?: TestThrowable) => void) => void | Promise<any>;

interface Test {
  readonly name: string;
  readonly fn: TestFn;
}

interface Context {
  readonly name: string;
  readonly log: TestLogEntry;
  readonly beforeEach: TestFn[];
  readonly afterEach: TestFn[];
  readonly tests: Test[];
  readonly parent?: Context;
}

const contexts: Context[] = [];

const getCurrentContext = (): Context | undefined => contexts[contexts.length - 1];

const getCurrentContextOrDie = (): Context => {
  const currentContext = getCurrentContext();
  if (currentContext === undefined) {
    throw new Error('Failed to find a current test context');
  } else {
    return currentContext;
  }
};

const createContext = (name: string): Context => {
  const currentContext = getCurrentContext();
  const baseContext = {
    beforeEach: [],
    afterEach: [],
    tests: [],
    parent: currentContext
  };

  if (currentContext === undefined) {
    return {
      ...baseContext,
      name,
      log: TestLogs.createLogEntry(name)
    }
  } else {
    return {
      ...baseContext,
      name: `${currentContext.name} / ${name}`,
      log: TestLogs.addLogEntry(currentContext.log, name)
    }
  }
};

const exec = (fn: TestFn, success: () => void, failure: (e: TestThrowable) => void) => {
  // If the function has 1 or more arguments, it's async
  if (fn.length > 0) {
    fn((err?: TestThrowable) => {
      if (err !== undefined) {
        failure(err);
      } else {
        success();
      }
    });
  } else {
    const retValue = fn();

    // Promise based return value
    if (retValue !== undefined && retValue.then !== undefined) {
      retValue.then(success, failure);
    } else {
      success();
    }
  }
};

const createTestLog = (context: Context): TestLogs => {
  const logs = TestLogs.init();
  let currentContext = context;
  while (currentContext.parent !== undefined) {
    currentContext = currentContext.parent;
  }
  logs.history.push(currentContext.log);
  return logs;
};

const runTest = (context: Context, test: Test) => {
  const logEntry = TestLogs.addLogEntry(context.log, test.name);
  Register.register(context.name + ' ' + test.name, (success, failure) => {
    const fail = (err: TestThrowable) => {
      TestLogs.addStackTrace(logEntry, Failure.normalizeError(err));
      const r = Failure.prepFailure(err, createTestLog(context));
      failure(r);
    };

    try {
      const funcs = context.beforeEach
        .concat([ test.fn ])
        .concat(context.afterEach);

      const chain = (index: number) => {
        if (index < funcs.length) {
          const fn = funcs[ index ];
          exec(fn, () => chain(index + 1), fail);
        } else {
          success();
        }
      };
      chain(0);
    } catch (e) {
      fail(e);
    }
  });
};

export const describe = (name: string, fn: () => void) => {
  const context = createContext(name);
  contexts.push(context);

  // Execute to populate the tests/hooks
  fn();

  // Run each test
  context.tests.forEach((test) => {
    runTest(context, test);
  });

  contexts.pop();
};
export const context = describe;

export const beforeEach = (fn: () => void) => {
  const currentContext = getCurrentContextOrDie()!;
  currentContext.beforeEach.push(fn);
};

export const afterEach = (fn: () => void) => {
  const currentContext = getCurrentContextOrDie();
  currentContext.afterEach.push(fn);
};

export const it = (name: string, fn: TestFn) => {
  const currentContext = getCurrentContextOrDie();
  currentContext.tests.push({
    name,
    fn
  });
};
export const specify = it;
