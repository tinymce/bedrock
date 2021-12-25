import { Hook, HookType, LoggedError, Suite } from '@ephox/bedrock-common';
import Promise from '@ephox/wrap-promise-polyfill';
import { createHook } from '../../../main/ts/core/Hook';
import { Reporter, TestReporter } from '../../../main/ts/reporter/Reporter';
import { RunState } from '../../../main/ts/runner/TestRun';
import { noop } from '../TestUtils';

type LoggedError = LoggedError.LoggedError;

export interface MockReporter extends Reporter {
  readonly failures: () => LoggedError[];
}

export const TEST_TIMEOUT = 200;

export const populateHooks = (suite: Suite, count: number, func: (idx: number, type: HookType) => void = noop): void => {
  for (let i = 0; i < count; i++) {
    const f = (type: HookType): Hook => {
      return createHook(type, () => {
        func(i, type);
      });
    };
    suite.hooks[HookType.Before].push(f(HookType.Before));
    suite.hooks[HookType.BeforeEach].push(f(HookType.BeforeEach));
    suite.hooks[HookType.After].push(f(HookType.After));
    suite.hooks[HookType.AfterEach].push(f(HookType.AfterEach));
  }
};

export const MockReporter = (): MockReporter => {
  let passed = 0;
  let skipped = 0;
  const failures: LoggedError[] = [];

  const test = (): TestReporter => ({
    start: () => Promise.resolve(),
    retry: () => Promise.resolve(),
    pass: () => {
      passed++;
      return Promise.resolve();
    },
    fail: (e) => {
      failures.push(e);
      return Promise.resolve();
    },
    skip: () => {
      skipped++;
      return Promise.resolve();
    }
  });

  return {
    test,
    summary: () => ({ offset: 0, passed, failed: failures.length, skipped }),
    done: noop,
    failures: () => failures
  };
};

export const createRunState = (offset: number, chunk: number, count = 0): RunState => ({
  totalTests: 1,
  offset,
  chunk,
  timeout: TEST_TIMEOUT,
  testCount: count
});