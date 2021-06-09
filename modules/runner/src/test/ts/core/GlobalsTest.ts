import { HookType, TestGlobals } from '@ephox/bedrock-common';
import { assert } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import * as Globals from '../../../main/ts/core/Globals';
import { noop } from '../TestUtils';

const last = <T>(items: T[]): T | undefined => {
  return items[items.length - 1];
};

describe('Globals.setup', () => {
  const rootSuite = Globals.rootSuite();
  let mockGlobals: TestGlobals;

  beforeEach(() => {
    mockGlobals = {} as TestGlobals;
    Globals.setup(mockGlobals);
  });

  afterEach(() => {
    rootSuite.suites = [];
    rootSuite.tests = [];
  });

  it('should allow describes', () => {
    mockGlobals.describe('describe suite', noop);
    assert.lengthOf(rootSuite.suites, 1);
    assert.equal(last(rootSuite.suites)?.title, 'describe suite');

    mockGlobals.context('context suite', noop);
    assert.lengthOf(rootSuite.suites, 2);
    assert.equal(last(rootSuite.suites)?.title, 'context suite');
  });

  it('should allow nested describes', () => {
    mockGlobals.describe('parent', () => {
      mockGlobals.describe('child', noop);
    });

    assert.lengthOf(rootSuite.suites, 1);
    const parentSuite = rootSuite.suites[0];
    assert.equal(parentSuite.title, 'parent');
    assert.equal(parentSuite.parent, rootSuite);
    assert.lengthOf(parentSuite.suites, 1);
    const childSuite = parentSuite.suites[0];
    assert.equal(childSuite.title, 'child');
    assert.equal(childSuite.parent, parentSuite);
  });

  it('should allow hooks to be configured', () => {
    mockGlobals.describe('test', () => {
      mockGlobals.before(noop);
      mockGlobals.beforeEach(noop);

      mockGlobals.after(noop);
      mockGlobals.afterEach(noop);
    });

    const suite = rootSuite.suites[0];
    assert.lengthOf(suite.hooks[HookType.Before], 1);
    assert.lengthOf(suite.hooks[HookType.BeforeEach], 1);
    assert.lengthOf(suite.hooks[HookType.After], 1);
    assert.lengthOf(suite.hooks[HookType.AfterEach], 1);

    assert.equal(suite.hooks[HookType.Before][0].title, 'before');
    assert.equal(suite.hooks[HookType.BeforeEach][0].title, 'beforeEach');
    assert.equal(suite.hooks[HookType.After][0].title, 'after');
    assert.equal(suite.hooks[HookType.AfterEach][0].title, 'afterEach');
  });

  it('should allow hooks with titles to be configured', () => {
    mockGlobals.describe('test', () => {
      mockGlobals.before('test before', noop);
      mockGlobals.beforeEach('test beforeEach', noop);

      mockGlobals.after('test after', noop);
      mockGlobals.afterEach('test afterEach', noop);
    });

    const suite = rootSuite.suites[0];
    assert.lengthOf(suite.hooks[HookType.Before], 1);
    assert.lengthOf(suite.hooks[HookType.BeforeEach], 1);
    assert.lengthOf(suite.hooks[HookType.After], 1);
    assert.lengthOf(suite.hooks[HookType.AfterEach], 1);

    assert.equal(suite.hooks[HookType.Before][0].title, 'before: test before');
    assert.equal(suite.hooks[HookType.BeforeEach][0].title, 'beforeEach: test beforeEach');
    assert.equal(suite.hooks[HookType.After][0].title, 'after: test after');
    assert.equal(suite.hooks[HookType.AfterEach][0].title, 'afterEach: test afterEach');
  });

  it('should allow tests', () => {
    mockGlobals.describe('root', () => {
      mockGlobals.it('it test', noop);
      mockGlobals.specify('specify test', noop);
    });

    assert.lengthOf(rootSuite.suites, 1);
    const suite = rootSuite.suites[0];
    assert.lengthOf(suite.tests, 2);

    const itTest = suite.tests[0];
    assert.equal(itTest.title, 'it test');
    assert.equal(itTest.parent, suite);
    assert.isFunction(itTest.fn);

    const specifyTest = suite.tests[1];
    assert.equal(specifyTest.title, 'specify test');
    assert.equal(specifyTest.parent, suite);
    assert.isFunction(specifyTest.fn);
  });

  it('handles hooks with an undefined title', () => {
    mockGlobals.describe('test', () => {
      // Note: We don't allow this via TypeScript, but mocha does handle it so we need to cast the undefined
      mockGlobals.before(undefined as any, noop);
    });

    const suite = rootSuite.suites[0];
    assert.lengthOf(suite.hooks[HookType.Before], 1);
    assert.equal(suite.hooks[HookType.Before][0].title, 'before');
  });
});