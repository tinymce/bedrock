import { Hook, Tests } from '@ephox/bedrock-common';
import { assert } from 'chai';
import * as fc from 'fast-check';
import { describe, it } from 'mocha';
import { Reporter } from '../../../main/ts/reporter/Reporter';
import * as Run from '../../../main/ts/runner/Run';
import * as TestUtils from './TestUtils';
import { populateHooks } from './TestUtils';

interface MockTest extends Tests.Test {
  hasRun: boolean;
}

const success = (success: () => void) => { success(); };
const createTest = (name: string, suite: Tests.Suite, testFn: Tests.RunFn = success) => {
  const test: MockTest = TestUtils.createTest(name, suite, (success, failure) => {
    test.hasRun = true;
    testFn(success, failure);
  }) as MockTest;
  test.hasRun = false;
  return test;
};

describe('Run.runTest', () => {
  let reporter: Reporter;
  let suite: Tests.Suite;
  let actions: Run.Actions;
  let loadedNextChunk: boolean;
  let onPassRun: boolean;
  let onFailureRun: boolean;

  beforeEach(() => {
    loadedNextChunk = onPassRun = onFailureRun = false;
    reporter = TestUtils.MockReporter();
    suite = TestUtils.createSuite('root');
    actions = {
      onFailure: () => onFailureRun = true,
      onPass: () => onPassRun = true,
      runNextChunk: () => loadedNextChunk = true
    };
  });

  it('should not run when offset is higher than the current test count', () => {
    fc.assert(fc.property(fc.integer(0, 100), fc.integer(1, 100), (count, startOffset) => {
      const test: MockTest = createTest('test', suite);
      const state = TestUtils.createRunState(count + startOffset, 10, count);
      Run.runTest(test, 'Test.ts', state, actions, reporter, () => {
        assert.isNotTrue(test.hasRun);
        assert.isNotTrue(onPassRun);
        assert.isNotTrue(onFailureRun);
        assert.isNotTrue(loadedNextChunk);
      });
    }));
  });

  it('should load next chunk when count is higher than the start offset + chunk', () => {
    fc.assert(fc.property(fc.integer(0, 100), fc.integer(1, 100), (startOffset, chunk) => {
      const test: MockTest = createTest('test', suite);
      const state = TestUtils.createRunState(startOffset, chunk, startOffset + chunk);
      Run.runTest(test, 'Test.ts', state, actions, reporter, () => {
        assert.isNotTrue(test.hasRun);
        assert.isNotTrue(onPassRun);
        assert.isNotTrue(onFailureRun);
        assert.isTrue(loadedNextChunk);
      });
    }));
  });

  it('should run when count is higher than offset', () => {
    fc.assert(fc.property(fc.integer(0, 100), fc.integer(0, 100), (count, offset) => {
      const test: MockTest = createTest('test', suite);
      const state = TestUtils.createRunState(offset, 200, offset + count);
      Run.runTest(test, 'Test.ts', state, actions, reporter, () => {
        assert.isTrue(test.hasRun);
        assert.isTrue(onPassRun);
        assert.isNotTrue(onFailureRun);
        assert.isNotTrue(loadedNextChunk);
      });
    }));
  });

  it('should fail on test timeout', (done) => {
    const test: MockTest = createTest('test', suite, (success) => {
      setTimeout(success, TestUtils.TEST_TIMEOUT + 100);
    });
    const state = TestUtils.createRunState(0, 100, 0);
    Run.runTest(test, 'Test.ts', state, actions, reporter, done);

    // Wait for the test to have timed out and then run assertions
    setTimeout(() => {
      assert.deepEqual(reporter.summary(), { offset: 0, failed: 1, passed: 0});
      assert.isTrue(test.hasRun);
      assert.isNotTrue(onPassRun);
      assert.isTrue(onFailureRun);
      assert.isNotTrue(loadedNextChunk);
      done();
    }, TestUtils.TEST_TIMEOUT + 200);
  });

  it('should run beforeEach and afterEach hooks', (done) => {
    const hooks: Hook[] = [];
    populateHooks(suite, 1, (_idx, type) => {
      hooks.push(type);
    });

    const test: MockTest = createTest('test', suite);
    const state = TestUtils.createRunState(0, 100, 0);
    Run.runTest(test, 'Test.ts', state, actions, reporter, () => {
      assert.isTrue(test.hasRun);
      assert.deepEqual(hooks, [ Hook.BeforeEach, Hook.AfterEach ]);
      done();
    });
  });
});

describe('Run.runSuite', () => {
  let reporter: Reporter;
  let suite: Tests.Suite;
  let test: MockTest;
  let actions: Run.Actions;

  beforeEach(() => {
    reporter = TestUtils.MockReporter();
    suite = TestUtils.createSuite('root');
    test = createTest('test', suite);
    suite.tests.push(test);
    actions = {
      onFailure: () => {},
      onPass: () => {},
      runNextChunk: () => {}
    };
  });

  it('should not run when offset is higher than the current + suite test count', () => {
    let hasRunSuite = false;
    populateHooks(suite, 1, () => hasRunSuite = true);

    fc.assert(fc.property(fc.integer(0, 100), fc.integer(1, 100), (count, startOffset) => {
      const state = TestUtils.createRunState(count + startOffset, 200, 0);
      Run.runSuite(suite, 'Test.ts', state, actions, reporter, () => {
        assert.isNotTrue(test.hasRun);
        assert.isNotTrue(hasRunSuite);
      });
    }));
  });

  it('should run before and after hooks', (done) => {
    const hooks: Hook[] = [];
    populateHooks(suite, 1, (_idx, type) => {
      hooks.push(type);
    });

    const state = TestUtils.createRunState(0, 100, 0);
    Run.runSuite(suite, 'Test.ts', state, actions, reporter, () => {
      assert.isTrue(test.hasRun);
      assert.deepEqual(hooks, [ Hook.Before, Hook.BeforeEach, Hook.AfterEach, Hook.After ]);
      done();
    });
  });
});