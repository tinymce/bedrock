import { Context, HookType, RunnableState, Suite, Test } from '@ephox/bedrock-common';
import Promise from '@ephox/wrap-promise-polyfill';
import { assert } from 'chai';
import * as fc from 'fast-check';
import { beforeEach, describe, it } from 'mocha';
import { createRootSuite } from '../../../main/ts/core/Suite';
import { createTest } from '../../../main/ts/core/Test';
import { Reporter } from '../../../main/ts/reporter/Reporter';
import * as TestRun from '../../../main/ts/runner/TestRun';
import { noop } from '../TestUtils';
import { MockReporter } from './RunnerTestUtils';
import * as RunnerTestUtils from './RunnerTestUtils';

interface MockTest extends Test {
  hasRun: boolean;
}

const sleep = (time: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, time));

const createMockTest = (name: string, suite: Suite, testFn?: (this: Context) => Promise<void>) => {
  const test: MockTest = createTest(name, function (this: Context) {
    test.hasRun = true;
    if (testFn === undefined) {
      return Promise.resolve();
    } else {
      return testFn.call(this);
    }
  }, suite) as MockTest;
  test.hasRun = false;
  return test;
};

describe('TestRun.runTest', () => {
  let reporter: MockReporter;
  let suite: Suite;
  let actions: TestRun.RunActions;
  let loadedNextChunk: boolean;
  let onPassRun: boolean;
  let onFailureRun: boolean;
  let onSkipRun: boolean;
  let onStartRun: boolean;

  beforeEach(() => {
    loadedNextChunk = onPassRun = onFailureRun = onSkipRun = onStartRun = false;
    reporter = RunnerTestUtils.MockReporter();
    suite = createRootSuite('root');
    actions = {
      onStart: () => onStartRun = true,
      onFailure: () => onFailureRun = true,
      onPass: () => onPassRun = true,
      onSkip: () => onSkipRun = true,
      runNextChunk: () => loadedNextChunk = true
    };
  });

  it('should not run when offset is higher than the current test count', () => {
    return fc.assert(fc.asyncProperty(fc.integer(0, 100), fc.integer(1, 100), (count, startOffset) => {
      const test: MockTest = createMockTest('test', suite);
      const state = RunnerTestUtils.createRunState(count + startOffset, 10, count);
      return TestRun.runTest(test, state, actions, reporter).then(() => {
        assert.isNotTrue(test.hasRun);
        assert.isNotTrue(onStartRun);
        assert.isNotTrue(onPassRun);
        assert.isNotTrue(onSkipRun);
        assert.isNotTrue(onFailureRun);
        assert.isNotTrue(loadedNextChunk);
      });
    }));
  });

  it('should load next chunk when count is higher than the start offset + chunk', () => {
    return fc.assert(fc.asyncProperty(fc.integer(0, 100), fc.integer(1, 100), (startOffset, chunk) => {
      const test: MockTest = createMockTest('test', suite);
      const state = RunnerTestUtils.createRunState(startOffset, chunk, startOffset + chunk);
      return TestRun.runTest(test, state, actions, reporter).catch(() => {
        assert.isNotTrue(test.hasRun);
        assert.isNotTrue(onStartRun);
        assert.isNotTrue(onPassRun);
        assert.isNotTrue(onSkipRun);
        assert.isNotTrue(onFailureRun);
        assert.isTrue(loadedNextChunk);
      });
    }));
  });

  it('should run when count is higher than offset', () => {
    return fc.assert(fc.asyncProperty(fc.integer(0, 100), fc.integer(0, 100), (count, offset) => {
      const test: MockTest = createMockTest('test', suite);
      const state = RunnerTestUtils.createRunState(offset, 200, offset + count);
      return TestRun.runTest(test, state, actions, reporter).then(() => {
        assert.isTrue(test.hasRun);
        assert.isTrue(onStartRun);
        assert.isTrue(onPassRun);
        assert.isNotTrue(onSkipRun);
        assert.isNotTrue(onFailureRun);
        assert.isNotTrue(loadedNextChunk);
      });
    }));
  });

  it('should not run when test is skipped', () => {
    return fc.assert(fc.asyncProperty(fc.integer(0, 100), fc.integer(0, 100), (count, offset) => {
      const test: MockTest = createMockTest('test', suite);
      test.setResult(RunnableState.Skipped);
      const state = RunnerTestUtils.createRunState(offset, 200, offset + count);
      return TestRun.runTest(test, state, actions, reporter).then(() => {
        assert.isNotTrue(test.hasRun);
        assert.isTrue(onStartRun);
        assert.isNotTrue(onPassRun);
        assert.isTrue(onSkipRun);
        assert.isNotTrue(onFailureRun);
        assert.isNotTrue(loadedNextChunk);
      });
    }));
  });

  it('should run multiple times when retries is enabled', () => {
    let count = 0;
    const test: MockTest = createMockTest('test', suite, () => {
      if (count++ < 3) {
        return Promise.reject(new Error('Test has not repeated enough times'));
      } else {
        return Promise.resolve();
      }
    });
    test.retries(3);
    const state = RunnerTestUtils.createRunState(0, 100, 0);
    return TestRun.runTest(test, state, actions, reporter).then(() => {
      assert.isTrue(test.hasRun);
      assert.isTrue(onStartRun);
      assert.isTrue(onPassRun);
      assert.isNotTrue(onSkipRun);
      assert.isNotTrue(onFailureRun);
      assert.isNotTrue(loadedNextChunk);
    });
  });

  it('should fail on default test timeout', () => {
    const test: MockTest = createMockTest('test', suite, () => {
      return sleep(RunnerTestUtils.TEST_TIMEOUT + 100);
    });
    const state = RunnerTestUtils.createRunState(0, 100, 0);
    TestRun.runTest(test, state, actions, reporter);

    // Wait for the test to have timed out and then run assertions
    return sleep(RunnerTestUtils.TEST_TIMEOUT + 200).then(() => {
      assert.deepEqual(reporter.summary(), { offset: 0, failed: 1, passed: 0, skipped: 0 });
      assert.isTrue(test.hasRun);
      assert.isTrue(onStartRun);
      assert.isNotTrue(onPassRun);
      assert.isNotTrue(onSkipRun);
      assert.isTrue(onFailureRun);
      assert.isNotTrue(loadedNextChunk);
      assert.equal(reporter.failures()[0].message, `Test ran too long - timeout of ${RunnerTestUtils.TEST_TIMEOUT}ms exceeded`);
    });
  });

  it('should fail on explicit test timeout', () => {
    const test: MockTest = createMockTest('test', suite, () => {
      return sleep(100);
    });
    test.timeout(50);
    const state = RunnerTestUtils.createRunState(0, 100, 0);
    TestRun.runTest(test, state, actions, reporter);

    // Wait for the test to have timed out and then run assertions
    return sleep(200).then(() => {
      assert.deepEqual(reporter.summary(), { offset: 0, failed: 1, passed: 0, skipped: 0 });
      assert.isTrue(test.hasRun);
      assert.isTrue(onStartRun);
      assert.isNotTrue(onPassRun);
      assert.isNotTrue(onSkipRun);
      assert.isTrue(onFailureRun);
      assert.isNotTrue(loadedNextChunk);
      assert.equal(reporter.failures()[0].message, `Test ran too long - timeout of 50ms exceeded`);
    });
  });

  it('should not timeout if the timeout is disabled', () => {
    const test: MockTest = createMockTest('test', suite, () => {
      return sleep(RunnerTestUtils.TEST_TIMEOUT + 100);
    });
    test.timeout(0); // Disable the timeout
    const state = RunnerTestUtils.createRunState(0, 100, 0);
    TestRun.runTest(test, state, actions, reporter);

    // Wait for the test to have timed out and then run assertions
    return sleep(RunnerTestUtils.TEST_TIMEOUT + 200)
      .then(() => {
        assert.deepEqual(reporter.summary(), { offset: 0, failed: 0, passed: 1, skipped: 0 });
        assert.isTrue(test.hasRun);
        assert.isTrue(onStartRun);
        assert.isTrue(onPassRun);
        assert.isNotTrue(onSkipRun);
        assert.isNotTrue(onFailureRun);
        assert.isNotTrue(loadedNextChunk);
      });
  });

  it('should run beforeEach and afterEach hooks', () => {
    const hooks: HookType[] = [];
    RunnerTestUtils.populateHooks(suite, 1, (_idx, type) => {
      hooks.push(type);
    });

    const test: MockTest = createMockTest('test', suite);
    const state = RunnerTestUtils.createRunState(0, 100, 0);
    return TestRun.runTest(test, state, actions, reporter).then(() => {
      assert.isTrue(test.hasRun);
      assert.deepEqual(hooks, [ HookType.BeforeEach, HookType.AfterEach ]);
    });
  });

  it('should not run beforeEach and afterEach hooks on a skipped test', () => {
    const hooks: HookType[] = [];
    RunnerTestUtils.populateHooks(suite, 1, (_idx, type) => {
      hooks.push(type);
    });

    const test: MockTest = createMockTest('test', suite);
    test.setResult(RunnableState.Skipped);
    const state = RunnerTestUtils.createRunState(0, 100, 0);
    return TestRun.runTest(test, state, actions, reporter).then(() => {
      assert.isNotTrue(test.hasRun);
      assert.deepEqual(hooks, [ ]);
    });
  });

  it('should run beforeEach and afterEach hooks on a lazily skipped test', () => {
    const hooks: HookType[] = [];
    RunnerTestUtils.populateHooks(suite, 1, (_idx, type) => {
      hooks.push(type);
    });

    const test: MockTest = createMockTest('test', suite, function () {
      this.skip();
      return Promise.resolve();
    });
    const state = RunnerTestUtils.createRunState(0, 100, 0);
    return TestRun.runTest(test, state, actions, reporter).then(() => {
      assert.isTrue(test.hasRun);
      assert.deepEqual(hooks, [ HookType.BeforeEach, HookType.AfterEach ]);
    });
  });

  it('should run beforeEach and afterEach hooks on a test failure', () => {
    const hooks: HookType[] = [];
    RunnerTestUtils.populateHooks(suite, 1, (_idx, type) => {
      hooks.push(type);
    });

    const test: MockTest = createMockTest('test', suite, () => Promise.reject('die'));
    const state = RunnerTestUtils.createRunState(0, 100, 0);
    return TestRun.runTest(test, state, actions, reporter).catch(() => {
      assert.isTrue(test.hasRun);
      assert.deepEqual(hooks, [ HookType.BeforeEach, HookType.AfterEach ]);
    });
  });

  it('should have the failed test state setup in an afterEach hook', () => {
    const states: RunnableState[] = [];
    RunnerTestUtils.populateHooks(suite, 1, () => {
      if (test.isFailed()) {
        states.push(RunnableState.Failed);
      } else if (test.isSkipped()) {
        states.push(RunnableState.Skipped);
      } else {
        states.push(RunnableState.NotRun);
      }
    });

    const test: MockTest = createMockTest('test', suite, () => Promise.reject('die'));
    const state = RunnerTestUtils.createRunState(0, 100, 0);
    return TestRun.runTest(test, state, actions, reporter).catch(() => {
      assert.isTrue(test.hasRun);
      assert.deepEqual(states, [ RunnableState.NotRun, RunnableState.Failed ]);
    });
  });
});

describe('TestRun.runSuite', () => {
  let reporter: Reporter;
  let suite: Suite;
  let test: MockTest;
  let actions: TestRun.RunActions;

  beforeEach(() => {
    reporter = RunnerTestUtils.MockReporter();
    suite = createRootSuite('root');
    test = createMockTest('test', suite);
    suite.tests.push(test);
    actions = {
      onStart: noop,
      onFailure: noop,
      onPass: noop,
      onSkip: noop,
      runNextChunk: noop
    };
  });

  it('should not run when offset is higher than the current + suite test count', () => {
    let hasRunSuite = false;
    RunnerTestUtils.populateHooks(suite, 1, () => hasRunSuite = true);

    return fc.assert(fc.asyncProperty(fc.integer(0, 100), fc.integer(1, 100), (count, startOffset) => {
      const state = RunnerTestUtils.createRunState(count + startOffset, 200, 0);
      return TestRun.runSuite(suite, state, actions, reporter).then(() => {
        assert.isNotTrue(test.hasRun);
        assert.isNotTrue(hasRunSuite);
      });
    }));
  });

  it('should run before and after hooks', () => {
    const hooks: HookType[] = [];
    RunnerTestUtils.populateHooks(suite, 1, (_idx, type) => {
      hooks.push(type);
    });

    const state = RunnerTestUtils.createRunState(0, 100, 0);
    return TestRun.runSuite(suite, state, actions, reporter).then(() => {
      assert.isTrue(test.hasRun);
      assert.deepEqual(hooks, [ HookType.Before, HookType.BeforeEach, HookType.AfterEach, HookType.After ]);
    });
  });

  it('should note run before and after hooks on a skipped suite', () => {
    const hooks: HookType[] = [];
    RunnerTestUtils.populateHooks(suite, 1, (_idx, type) => {
      hooks.push(type);
    });
    suite._skip = true;

    const state = RunnerTestUtils.createRunState(0, 100, 0);
    return TestRun.runSuite(suite, state, actions, reporter).then(() => {
      assert.isNotTrue(test.hasRun);
      assert.deepEqual(hooks, [ ]);
    });
  });

  it('should run before and after hooks on a test failure', () => {
    const hooks: HookType[] = [];
    RunnerTestUtils.populateHooks(suite, 1, (_idx, type) => {
      hooks.push(type);
    });

    const failingTest = createMockTest('fail test', suite, () => Promise.reject('die'));
    suite.tests.push(failingTest);

    const state = RunnerTestUtils.createRunState(0, 100, 0);
    return TestRun.runSuite(suite, state, actions, reporter).catch(() => {
      assert.isTrue(test.hasRun);
      assert.isTrue(failingTest.hasRun);
      assert.deepEqual(hooks, [ HookType.Before, HookType.BeforeEach, HookType.AfterEach, HookType.BeforeEach, HookType.AfterEach, HookType.After ]);
    });
  });
});