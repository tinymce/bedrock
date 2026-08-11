import { Context, ExecuteFn, HookType, LoggedError, RunnableState, Suite, Test } from '@ephox/bedrock-common';
import { assert } from 'chai';
import * as fc from 'fast-check';
import { beforeEach, describe, it } from 'mocha';
import { createHook } from '../../../main/ts/core/Hook';
import { createRootSuite, createSuite } from '../../../main/ts/core/Suite';
import { createTest } from '../../../main/ts/core/Test';
import * as TestRun from '../../../main/ts/runner/TestRun';
import { noop } from '../TestUtils';
import { MockReporter } from './RunnerTestUtils';
import * as RunnerTestUtils from './RunnerTestUtils';

interface MockTest extends Test {
  hasRun: boolean;
}

const sleep = (time: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, time));

const addHook = (suite: Suite, type: HookType, fn: ExecuteFn): void => {
  suite.hooks[type].push(createHook(type, fn));
};

const expectReportedFailure = (promise: Promise<void>, assertions: () => void): Promise<void> =>
  promise.then(() => {
    assert.fail('Expected the run to reject');
  }, (e) => {
    assert.isUndefined(e, 'A reported failure must reject with no error, otherwise it is treated as a bedrock error');
    assertions();
  });

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

  it('should report a failure when a beforeEach hook rejects', () => {
    addHook(suite, HookType.BeforeEach, () => Promise.reject(new Error('beforeEach died')));

    const test: MockTest = createMockTest('test', suite);
    const state = RunnerTestUtils.createRunState(0, 100, 0);
    return expectReportedFailure(TestRun.runTest(test, state, actions, reporter), () => {
      assert.isNotTrue(test.hasRun);
      assert.isTrue(onFailureRun);
      assert.equal(reporter.failures()[0].message, 'beforeEach died');
    });
  });

  it('should report a failure when a beforeEach hook throws', () => {
    addHook(suite, HookType.BeforeEach, () => {
      throw new Error('beforeEach died');
    });

    const test: MockTest = createMockTest('test', suite);
    const state = RunnerTestUtils.createRunState(0, 100, 0);
    return expectReportedFailure(TestRun.runTest(test, state, actions, reporter), () => {
      assert.isNotTrue(test.hasRun);
      assert.isTrue(onFailureRun);
      assert.equal(reporter.failures()[0].message, 'beforeEach died');
    });
  });

  it('should report a failure when an afterEach hook rejects', () => {
    addHook(suite, HookType.AfterEach, () => Promise.reject(new Error('afterEach died')));

    const test: MockTest = createMockTest('test', suite);
    const state = RunnerTestUtils.createRunState(0, 100, 0);
    return expectReportedFailure(TestRun.runTest(test, state, actions, reporter), () => {
      assert.isTrue(test.hasRun);
      assert.isTrue(onFailureRun);
      assert.equal(reporter.failures()[0].message, 'afterEach died');
    });
  });

  it('should keep the test error when an afterEach hook fails as well', () => {
    addHook(suite, HookType.AfterEach, () => Promise.reject(new Error('afterEach died')));

    const test: MockTest = createMockTest('test', suite, () => Promise.reject(new Error('test died')));
    const state = RunnerTestUtils.createRunState(0, 100, 0);
    return expectReportedFailure(TestRun.runTest(test, state, actions, reporter), () => {
      assert.lengthOf(reporter.failures(), 1);
      assert.equal(reporter.failures()[0].message, 'test died');
    });
  });

  it('should report a failure when a hook rejects without a reason', () => {
    addHook(suite, HookType.BeforeEach, () => Promise.reject());

    const test: MockTest = createMockTest('test', suite);
    const state = RunnerTestUtils.createRunState(0, 100, 0);
    return expectReportedFailure(TestRun.runTest(test, state, actions, reporter), () => {
      assert.isNotTrue(test.hasRun);
      assert.equal(reporter.failures()[0].message, 'Failed with no or falsy error: undefined');
    });
  });
});

describe('TestRun.reportStrayError', () => {
  let reporter: MockReporter;
  let suite: Suite;
  let state: TestRun.RunState;
  const error = LoggedError.loggedError(new Error('landed after the test'), []);

  beforeEach(() => {
    reporter = RunnerTestUtils.MockReporter();
    suite = createRootSuite('root');
    state = RunnerTestUtils.createRunState(0, 100, 0);
  });

  it('should fail the test it is attributed to', () => {
    const test = createMockTest('test', suite);
    state.currentTest = test;

    TestRun.reportStrayError(state, reporter)(error);

    assert.isTrue(test.isFailed(), 'The test should be marked as failed');
    assert.deepEqual(reporter.failedNames(), [ 'root - test' ]);
  });

  it('should not replace the error of a test that already failed', () => {
    const test = createMockTest('test', suite);
    test.setResult(RunnableState.Failed, new Error('Test ran too long'));
    state.currentTest = test;

    TestRun.reportStrayError(state, reporter)(error);

    assert.deepEqual(reporter.failedNames(), [ 'root - test (error after test)' ], 'The name must differ so the reported failure is kept');
    assert.equal(test.error?.message, 'Test ran too long');
  });

  it('should still report an error that arrives before any test has run', () => {
    TestRun.reportStrayError(state, reporter)(error);

    assert.deepEqual(reporter.failedNames(), [ 'Unknown' ]);
    assert.equal(reporter.failures()[0].message, 'landed after the test');
  });
});

describe('TestRun.runSuite', () => {
  let reporter: MockReporter;
  let suite: Suite;
  let test: MockTest;
  let actions: TestRun.RunActions;
  let onFailureRun: boolean;

  beforeEach(() => {
    onFailureRun = false;
    reporter = RunnerTestUtils.MockReporter();
    suite = createRootSuite('root');
    test = createMockTest('test', suite);
    suite.tests.push(test);
    actions = {
      onStart: noop,
      onFailure: () => onFailureRun = true,
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

  it('should report a failure when a before hook rejects', () => {
    addHook(suite, HookType.Before, () => Promise.reject(new Error('before died')));

    const state = RunnerTestUtils.createRunState(0, 100, 0);
    return expectReportedFailure(TestRun.runSuite(suite, state, actions, reporter), () => {
      assert.isNotTrue(test.hasRun);
      assert.isTrue(onFailureRun);
      assert.deepEqual(reporter.failedNames(), [ 'root "before" hook' ]);
      assert.equal(reporter.failures()[0].message, 'before died');
    });
  });

  it('should report a failure when a before hook throws', () => {
    addHook(suite, HookType.Before, () => {
      throw new Error('before died');
    });

    const state = RunnerTestUtils.createRunState(0, 100, 0);
    return expectReportedFailure(TestRun.runSuite(suite, state, actions, reporter), () => {
      assert.isNotTrue(test.hasRun);
      assert.isTrue(onFailureRun);
      assert.deepEqual(reporter.failedNames(), [ 'root "before" hook' ]);
      assert.equal(reporter.failures()[0].message, 'before died');
    });
  });

  it('should still run the after hooks when a before hook fails', () => {
    const hooks: HookType[] = [];
    RunnerTestUtils.populateHooks(suite, 1, (_idx, type) => {
      hooks.push(type);
    });
    addHook(suite, HookType.Before, () => Promise.reject(new Error('before died')));

    const state = RunnerTestUtils.createRunState(0, 100, 0);
    return expectReportedFailure(TestRun.runSuite(suite, state, actions, reporter), () => {
      assert.deepEqual(hooks, [ HookType.Before, HookType.After ]);
    });
  });

  it('should report a failure when an after hook rejects', () => {
    addHook(suite, HookType.After, () => Promise.reject(new Error('after died')));

    const state = RunnerTestUtils.createRunState(0, 100, 0);
    return expectReportedFailure(TestRun.runSuite(suite, state, actions, reporter), () => {
      assert.isTrue(test.hasRun);
      assert.isTrue(onFailureRun);
      assert.deepEqual(reporter.failedNames(), [ 'root "after" hook' ]);
      assert.equal(reporter.failures()[0].message, 'after died');
    });
  });

  it('should report a failure when an after hook throws', () => {
    addHook(suite, HookType.After, () => {
      throw new Error('after died');
    });

    const state = RunnerTestUtils.createRunState(0, 100, 0);
    return expectReportedFailure(TestRun.runSuite(suite, state, actions, reporter), () => {
      assert.isTrue(test.hasRun);
      assert.isTrue(onFailureRun);
      assert.deepEqual(reporter.failedNames(), [ 'root "after" hook' ]);
      assert.equal(reporter.failures()[0].message, 'after died');
    });
  });

  it('should keep the test failure when an after hook fails as well', () => {
    const failingTest = createMockTest('fail test', suite, () => Promise.reject(new Error('test died')));
    suite.tests.push(failingTest);
    addHook(suite, HookType.After, () => Promise.reject(new Error('after died')));

    const state = RunnerTestUtils.createRunState(0, 100, 0);
    return expectReportedFailure(TestRun.runSuite(suite, state, actions, reporter), () => {
      assert.deepEqual(reporter.failedNames(), [ 'root - fail test' ]);
      assert.equal(reporter.failures()[0].message, 'test died');
    });
  });

  it('should report a failure when a nested suite before hook fails, without failing the parent', () => {
    const nested = createSuite('nested', suite);
    suite.suites.push(nested);
    nested.tests.push(createMockTest('nested test', nested));
    addHook(nested, HookType.Before, () => Promise.reject(new Error('before died')));

    const state = RunnerTestUtils.createRunState(0, 100, 0);
    return expectReportedFailure(TestRun.runSuite(suite, state, actions, reporter), () => {
      assert.isTrue(test.hasRun);
      assert.deepEqual(reporter.failedNames(), [ 'root / nested "before" hook' ]);
    });
  });
});
