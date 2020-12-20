import { assert } from 'chai';
import * as fc from 'fast-check';
import { describe, it, Suite, Test } from 'mocha';
import * as Utils from '../../../main/ts/runner/Utils';
import { noop, range } from '../TestUtils';

const setupTestSuite = (numRoot: number, numChild1: number, numChild2: number) => {
  const root = new Suite('root');
  const child1 = new Suite('child 1');
  const child2 = new Suite('child 2');
  const rootTests = range(numRoot, (i) => new Test(`test ${i}`, noop));
  const child1Tests = range(numChild1, (i) => new Test(`child 1 test ${i}`, noop));
  const child2Tests = range(numChild2, (i) => new Test(`child 2 test ${i}`, noop));

  root.addSuite(child1);
  child1.addSuite(child2);
  rootTests.forEach((test) => root.addTest(test));
  child1Tests.forEach((test) => child1.addTest(test));
  child2Tests.forEach((test) => child2.addTest(test));

  return {
    root,
    child1,
    child2,
    rootTests,
    child1Tests,
    child2Tests
  };
};

describe('Utils.isTest', () => {
  it('should be true for tests', () => {
    const test = new Test('test', noop);
    assert.isTrue(Utils.isTest(test));
  });

  it('should be false for suites', () => {
    const suite = new Suite('test');
    assert.isFalse(Utils.isTest(suite));
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

describe('Utils.filterOmittedTests', () => {
  it('should remove test from parent suite', () => {
    fc.assert(fc.property(fc.nat(50), fc.integer(1, 50), fc.integer(1, 50), (numRoot, numChild1, numChild2) => {
      const { root, child1, child2, child2Tests } = setupTestSuite(numRoot, numChild1, numChild2);
      const randomTestNum = Math.floor(Math.random() * numChild2);
      const randomTest = child2Tests[randomTestNum];

      Utils.filterOmittedTests(randomTest);
      assert.equal(child2.total(), numChild2 - 1);
      assert.equal(child1.total(), numChild1 + numChild2 - 1);
      assert.equal(root.total(), numRoot + numChild1 + numChild2 - 1);
    }));
  });

  it('should remove suite from parent suite', () => {
    fc.assert(fc.property(fc.nat(50), fc.integer(1, 50), fc.integer(1, 50), (numRoot, numChild1, numChild2) => {
      const { root, child1, child2 } = setupTestSuite(numRoot, numChild1, numChild2);

      Utils.filterOmittedTests(child2);
      assert.lengthOf(child1.suites, 0);
      assert.equal(child1.total(), numChild1);
      assert.equal(root.total(), numRoot + numChild1);
    }));
  });

  it('should remove test and parent suite if no tests left', () => {
    const { root, child1, child2Tests } = setupTestSuite(1, 1, 1);
    const child2Test = child2Tests[0];

    Utils.filterOmittedTests(child2Test);
    assert.lengthOf(child1.suites, 0);
    assert.equal(child1.total(), 1);
    assert.equal(root.total(), 2);
  });
});