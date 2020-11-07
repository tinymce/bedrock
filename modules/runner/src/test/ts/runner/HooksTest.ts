import { Hook, Tests } from '@ephox/bedrock-common';
import { assert } from 'chai';
import { describe, it } from 'mocha';
import * as Hooks from '../../../main/ts/runner/Hooks';
import * as TestUtils from './TestUtils';

describe('Hooks.getHooks', () => {
  let root: Tests.Suite;
  let nested: Tests.Suite;

  beforeEach(() => {
    root = TestUtils.createSuite('root');
    nested = TestUtils.createSuite('nested', root);
    TestUtils.populateHooks(root, 1);
    TestUtils.populateHooks(nested, 1);
  });

  it('include parent hooks', () => {
    const nestedHooks = Hooks.getHooks(nested, Hook.After, true);
    assert.lengthOf(nestedHooks, 2);

    const rootHooks = Hooks.getHooks(root, Hook.After, true);
    assert.lengthOf(rootHooks, 1);
  });

  it('exclude parent hooks', () => {
    const hooks = Hooks.getHooks(nested, Hook.Before, false);
    assert.lengthOf(hooks, 1);
  });

  it('returns no hooks when a suite has undefined hooks', () => {
    const noHooksSuite = TestUtils.createSuite('no-hooks', root, false);
    const hooks = Hooks.getHooks(noHooksSuite, Hook.BeforeEach, false);
    assert.lengthOf(hooks, 0);
  });
});

describe('Hooks.runHooks', () => {
  let root: Tests.Suite;
  let nested: Tests.Suite;
  let callStack: string[];

  beforeEach(() => {
    root = TestUtils.createSuite('root');
    nested = TestUtils.createSuite('nested', root);
    callStack = [];
    TestUtils.populateHooks(root, 2, (idx) => callStack.push('root' + idx));
    TestUtils.populateHooks(nested, 2, (idx) => callStack.push('nested' + idx));
  });

  it('runs beforeEach hooks from bottom up', (done) => {
    Hooks.runHooks(nested, Hook.BeforeEach, true, () => {
      assert.deepEqual(callStack, [ 'nested0', 'nested1', 'root0', 'root1' ]);
      done();
    });
  });

  it('runs afterEach hooks from top down', (done) => {
    Hooks.runHooks(nested, Hook.AfterEach, true, () => {
      assert.deepEqual(callStack, [ 'root1', 'root0', 'nested1', 'nested0' ]);
      done();
    });
  });
});