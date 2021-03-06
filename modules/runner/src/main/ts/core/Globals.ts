import { ExecuteFn, Global, HookType, RunnableState, Suite, Test, TestGlobals } from '@ephox/bedrock-common';
import * as Hook from './Hook';
import * as Register from './Register';
import { createSuite, createRootSuite } from './Suite';
import { createTest } from './Test';

const root = createRootSuite('');
const suiteStack: Suite[] = [ root ];

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

const addHook = (suite: Suite, type: HookType, title: string | ExecuteFn, fn?: ExecuteFn) => {
  if (typeof title === 'string' && fn !== undefined) {
    const hook = Hook.createHook(`${type}: ${title}`, fn);
    suite.hooks[type].push(hook);
  } else if (typeof title === 'function') {
    const hook = Hook.createHook(type, title);
    suite.hooks[type].push(hook);
  } else {
    console.error('Failed to add hook', title, fn);
  }
};

export const describe = (title: string, fn: () => void): Suite => {
  const current = getCurrentSuiteOrDie();
  const suite = createSuite(title, current);
  current.suites.push(suite);
  suiteStack.push(suite);
  fn.call(suite);
  suiteStack.pop();
  return suite;
};

describe.only = (title: string, fn: () => void): Suite => {
  const suite = describe(title, fn);
  suite._only = true;
  return suite;
};

describe.skip = (title: string, fn: () => void): Suite => {
  const suite = describe(title, fn);
  suite._skip = true;
  return suite;
};

export const before = (title: string | ExecuteFn, fn?: ExecuteFn): void => {
  const suite = getCurrentSuiteOrDie();
  addHook(suite, HookType.Before, title, fn);
};

export const beforeEach = (title: string | ExecuteFn, fn?: ExecuteFn): void => {
  const suite = getCurrentSuiteOrDie();
  addHook(suite, HookType.BeforeEach, title, fn);
};

export const after = (title: string | ExecuteFn, fn?: ExecuteFn): void => {
  const suite = getCurrentSuiteOrDie();
  addHook(suite, HookType.After, title, fn);
};

export const afterEach = (title: string | ExecuteFn, fn?: ExecuteFn): void => {
  const suite = getCurrentSuiteOrDie();
  addHook(suite, HookType.AfterEach, title, fn);
};

export const it = (title: string, fn: ExecuteFn): Test => {
  const suite = getCurrentSuiteOrDie();
  const test = createTest(title, fn, suite);

  suite.tests.push(test);
  Register.test(test);

  return test;
};

it.only = (title: string, fn: ExecuteFn): Test => {
  const test = it(title, fn);
  test._only = true;
  return test;
};

it.skip = (title: string, fn: ExecuteFn): Test => {
  const test = it(title, fn);
  test.setResult(RunnableState.Skipped);
  return test;
};

export const setup = (global: any = Global): void => {
  const globals: TestGlobals = {
    before,
    beforeEach,
    after,
    afterEach,

    describe,
    xdescribe: describe.skip,
    context: describe,
    xcontext: describe.skip,

    it,
    xit: it.skip,
    specify: it,
    xspecify: it.skip
  };

  const keys = Object.keys(globals) as (keyof TestGlobals)[];
  keys.forEach((key) => {
    global[key] = globals[key];
  });
};

export const rootSuite = (): Suite => root;