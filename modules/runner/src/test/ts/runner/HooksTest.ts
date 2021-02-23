import { Context, HookType, Suite } from '@ephox/bedrock-common';
import { assert } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import { createHook } from '../../../main/ts/core/Hook';
import { createSuite, createRootSuite } from '../../../main/ts/core/Suite';
import { createTest } from '../../../main/ts/core/Test';
import * as Hooks from '../../../main/ts/runner/Hooks';
import { noop } from '../TestUtils';
import * as RunnerTestUtils from './RunnerTestUtils';

describe('Hooks.getHooks', () => {
  let root: Suite;
  let nested: Suite;

  beforeEach(() => {
    root = createRootSuite('root');
    nested = createSuite('nested', root);
    RunnerTestUtils.populateHooks(root, 1);
    RunnerTestUtils.populateHooks(nested, 1);
  });

  it('include parent hooks', () => {
    const nestedHooks = Hooks.getHooks(nested, HookType.After, true);
    assert.lengthOf(nestedHooks, 2);

    const rootHooks = Hooks.getHooks(root, HookType.After, true);
    assert.lengthOf(rootHooks, 1);
  });

  it('exclude parent hooks', () => {
    const hooks = Hooks.getHooks(nested, HookType.Before, false);
    assert.lengthOf(hooks, 1);
  });

  it('returns no hooks when a suite is skipped', () => {
    const skippedSuite = createSuite('no-hooks', root);
    skippedSuite._skip = true;
    const beforeEachHooks = Hooks.getHooks(skippedSuite, HookType.BeforeEach, true);
    const afterHooks = Hooks.getHooks(skippedSuite, HookType.After, false);
    assert.lengthOf(beforeEachHooks, 0);
    assert.lengthOf(afterHooks, 0);
  });
});

describe('Hooks.runHooks', () => {
  let root: Suite;
  let nested: Suite;
  let callStack: string[];

  beforeEach(() => {
    root = createRootSuite('root');
    nested = createSuite('nested', root);
    callStack = [];
    RunnerTestUtils.populateHooks(root, 2, (idx) => callStack.push('root' + idx));
    RunnerTestUtils.populateHooks(nested, 2, (idx) => callStack.push('nested' + idx));
  });

  it('runs beforeEach hooks from top down', () => {
    return Hooks.runHooks(nested, HookType.BeforeEach, true).then(() => {
      assert.deepEqual(callStack, [ 'root0', 'root1', 'nested0', 'nested1' ]);
    });
  });

  it('runs afterEach hooks from bottom up', () => {
    return Hooks.runHooks(nested, HookType.AfterEach, true).then(() => {
      assert.deepEqual(callStack, [ 'nested0', 'nested1', 'root0', 'root1' ]);
    });
  });

  it('should skip all tests if skip() called in a before hook', () => {
    nested.hooks.before.push(createHook(HookType.Before, function (this: Context) {
      this.skip();
    }));
    const test = createTest('test', noop, nested);
    nested.tests.push(test);
    return Hooks.runBefore(nested, test).then(() => {
      assert.isTrue(test.isSkipped());
    });
  });

  it('should skip the current test if skip() called in a beforeEach hook', () => {
    nested.hooks.beforeEach.push(createHook(HookType.BeforeEach, function (this: Context) {
      this.skip();
    }));
    const test = createTest('test', noop, nested);
    nested.tests.push(test);
    return Hooks.runBeforeEach(test).then(() => {
      assert.isTrue(test.isSkipped());
    });
  });

  it('should not run additional hooks if skipped', () => {
    root.hooks.before.unshift(createHook(HookType.Before, function (this: Context) {
      this.skip();
    }));
    const test = createTest('test', noop, root);
    root.tests.push(test);
    return Hooks.runBefore(root, test).then(() => {
      assert.isTrue(test.isSkipped());
      assert.deepEqual(callStack, [ ]);
    });
  });

  it('should handle a timeout being adjusted during execution', () => {
    root.hooks.before.push(createHook(HookType.Before, function (this: Context, done) {
      // Default timeout is 2000
      this.timeout(2500);
      setTimeout(done, 2250);
    }));
    const test = createTest('test', noop, root);
    root.tests.push(test);
    return Hooks.runBefore(root, test).then(() => {
      assert.isFalse(test.isFailed());
      assert.isFalse(test.isSkipped());
      assert.deepEqual(callStack, [ 'root0', 'root1' ]);
    });
  }).timeout(4000);
});