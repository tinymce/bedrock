import { Suite } from '@ephox/bedrock-common';
import Promise from '@ephox/wrap-promise-polyfill';
import { assert } from 'chai';
import * as fc from 'fast-check';
import { describe, it } from 'mocha';
import { createSuite, createRootSuite } from '../../../main/ts/core/Suite';
import { createTest } from '../../../main/ts/core/Test';
import * as Utils from '../../../main/ts/runner/Utils';
import { noop, range } from '../TestUtils';

const setupTestSuite = (numRoot: number, numChild1: number, numChild2: number) => {
  const root = createRootSuite('root');
  const child1 = createSuite('child 1', root);
  const child2 = createSuite('child 2', child1);
  const rootTests = range(numRoot, (i) => createTest(`test ${i}`, noop));
  const child1Tests = range(numChild1, (i) => createTest(`child 1 test ${i}`, noop));
  const child2Tests = range(numChild2, (i) => createTest(`child 2 test ${i}`, noop));

  root.suites = [ child1 ];
  child1.suites = [ child2 ];
  root.tests = rootTests;
  child1.tests = child1Tests;
  child2.tests = child2Tests;

  return {
    root,
    child1,
    child2,
    rootTests,
    child1Tests,
    child2Tests
  };
};

describe('Utils.countTests', () => {
  const populateTests = (name: string, suite: Suite, count: number) => {
    for (let i = 0; i < count; i++) {
      suite.tests.push(createTest(name, noop, suite));
    }
  };

  it('should work with nested suites', () => {
    fc.assert(fc.property(fc.integer(0, 10), fc.integer(0, 10), (numRootTests, numNestedTests) => {
      const root = createRootSuite('root');
      const nested = createSuite('nested', root);
      root.suites.push(nested);
      populateTests('root test', root, numRootTests);
      populateTests('nested test', nested, numNestedTests);

      assert.equal(Utils.countTests(root), numRootTests + numNestedTests);
    }));
  });
});

describe('Utils.loop', () => {
  it('should execute each item in order', () => {
    return fc.assert(fc.asyncProperty(fc.array(fc.anything({ values: [ fc.integer(), fc.string(), fc.boolean() ]})), (items) => {
      const stack: unknown[] = [];
      return Utils.loop(items, (item) => {
        stack.push(item);
        return Promise.resolve();
      }).then(() => {
        assert.sameMembers(stack, items);
      });
    }));
  });
});

describe('Utils.getTests', () => {
  it('should find nested tests, while ensuring the run order is maintained', () => {
    fc.assert(fc.property(fc.nat(50), fc.nat(50), fc.nat(50), (numRoot, numChild1, numChild2) => {
      const { root, child1, child2, rootTests, child1Tests, child2Tests } = setupTestSuite(numRoot, numChild1, numChild2);

      const result1 = Utils.getTests(root);
      assert.lengthOf(result1, numRoot + numChild1 + numChild2, 'number of tests from root suite');
      assert.sameOrderedMembers(result1, rootTests.concat(child1Tests, child2Tests), 'tests from root suite');

      const result2 = Utils.getTests(child1);
      assert.lengthOf(result2, numChild1 + numChild2, 'number of tests from child suite 1');
      assert.sameOrderedMembers(result2, child1Tests.concat(child2Tests), 'tests from child suite 1');

      const result3 = Utils.getTests(child2);
      assert.lengthOf(result3, numChild2, 'number of tests from child suite 2');
      assert.sameOrderedMembers(result3, child2Tests, 'tests from child suite 2');
    }));
  }).slow(150);
});

describe('Utils.getSuites', () => {
  it('should find nested suites, while ensuring the run order is maintained', () => {
    const { root, child1, child2 } = setupTestSuite(1, 1, 1);

    const result1 = Utils.getSuites(root);
    assert.lengthOf(result1, 2, 'number of suites from root suite');
    assert.sameOrderedMembers(result1, [ child1, child2 ], 'suites from root suite');

    const result2 = Utils.getSuites(child1);
    assert.lengthOf(result2, 1, 'number of suites from child suite 1');
    assert.sameOrderedMembers(result2, [ child2 ], 'suites from child suite 1');

    const result3 = Utils.getSuites(child2);
    assert.lengthOf(result3, 0, 'number of suites from child suite 2');
    assert.sameOrderedMembers(result3, [], 'suites from child suite 2');
  }).slow(150);
});

describe('Utils.filterOnly', () => {
  it('should remove all other tests/suites for only test', () => {
    fc.assert(fc.property(fc.nat(50), fc.integer(1, 50), fc.integer(1, 50), (numRoot, numChild1, numChild2) => {
      const { root, child1, child2, child2Tests } = setupTestSuite(numRoot, numChild1, numChild2);
      const randomTestNum = Math.floor(Math.random() * numChild2);
      const randomTest = child2Tests[randomTestNum];
      randomTest._only = true;

      Utils.filterOnly(root);
      assert.lengthOf(child2.tests, 1);
      assert.lengthOf(child2.suites, 0);
      assert.lengthOf(child1.tests, 0);
      assert.lengthOf(child1.suites, 1);
      assert.lengthOf(root.tests, 0);
      assert.lengthOf(root.suites, 1);
    }));
  });

  it('should remove all nested suites for only test', () => {
    fc.assert(fc.property(fc.nat(50), fc.integer(1, 50), fc.integer(1, 50), (numRoot, numChild1, numChild2) => {
      const { root, child1, child1Tests } = setupTestSuite(numRoot, numChild1, numChild2);
      const randomTestNum = Math.floor(Math.random() * numChild1);
      const randomTest = child1Tests[randomTestNum];
      randomTest._only = true;

      Utils.filterOnly(root);
      assert.lengthOf(child1.tests, 1);
      assert.lengthOf(child1.suites, 0);
      assert.lengthOf(root.tests, 0);
      assert.lengthOf(root.suites, 1);
    }));
  });

  it('should remove all other suites for only suite', () => {
    fc.assert(fc.property(fc.nat(50), fc.integer(1, 50), fc.integer(1, 50), (numRoot, numChild1, numChild2) => {
      const { root, child1, child2 } = setupTestSuite(numRoot, numChild1, numChild2);
      child1._only = true;

      Utils.filterOnly(root);
      assert.lengthOf(child2.tests, numChild2);
      assert.lengthOf(child2.suites, 0);
      assert.lengthOf(child1.tests, numChild1);
      assert.lengthOf(child1.suites, 1);
      assert.lengthOf(root.tests, 0);
      assert.lengthOf(root.suites, 1);
    }));
  });
});