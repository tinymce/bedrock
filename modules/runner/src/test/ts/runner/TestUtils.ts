import { Hook, Tests } from '@ephox/bedrock-common';
import { Reporter, TestReporter } from '../../../main/ts/reporter/Reporter';
import * as Run from '../../../main/ts/runner/Run';

const noop = () => {};

export const TEST_TIMEOUT = 200;

export const createSuite = (name: string, parent?: Tests.Suite, includeHooks = true): Tests.Suite => ({
  name,
  tests: [],
  suites: [],
  parent,
  hooks: includeHooks ? {
    [Hook.Before]: [],
    [Hook.BeforeEach]: [],
    [Hook.After]: [],
    [Hook.AfterEach]: [],
  } : undefined
});

export const populateHooks = (suite: Tests.Suite, count: number, func: (idx: number, type: Hook) => void = noop): void => {
  for (let i = 0; i < count; i++) {
    const f = (type: Hook) => (success: () => void) => {
      func(i, type);
      success();
    };
    suite.hooks?.[Hook.Before].push(f(Hook.Before));
    suite.hooks?.[Hook.BeforeEach].push(f(Hook.BeforeEach));
    suite.hooks?.[Hook.After].push(f(Hook.After));
    suite.hooks?.[Hook.AfterEach].push(f(Hook.AfterEach));
  }
};

export const createTest = (name: string, suite: Tests.Suite, testFn: Tests.RunFn = noop): Tests.Test => ({
  name,
  suite,
  test: testFn
});

export const MockReporter = (): Reporter => {
  let passed = 0;
  let failed = 0;

  const test = (): TestReporter => ({
    start: (done) => done({}),
    pass: (done) => {
      passed++;
      done({});
    },
    fail: (e, done) => {
      failed++;
      done({});
    }
  });

  return {
    test,
    summary: () => ({ offset: 0, passed, failed }),
    done: () => {}
  };
};

export const createRunState = (offset: number, chunk: number, count = 0): Run.State => ({
  totalTests: 1,
  offset,
  chunk,
  timeout: TEST_TIMEOUT,
  testCount: count
});