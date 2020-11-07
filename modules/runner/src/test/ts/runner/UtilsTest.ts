import { Tests } from '@ephox/bedrock-common';
import { assert } from 'chai';
import * as fc from 'fast-check';
import { describe, it } from 'mocha';
import * as Utils from '../../../main/ts/runner/Utils';
import * as TestUtils from './TestUtils';

describe('Utils.countTests', () => {
  const populateTests = (name: string, suite: Tests.Suite, count: number) => {
    for (let i = 0; i < count; i++) {
      suite.tests.push(TestUtils.createTest(name, suite));
    }
  };

  it('should testCount nested suites', () => {
    fc.assert(fc.property(fc.integer(0, 10), fc.integer(0, 10), (numRootTests, numNestedTests) => {
      const root = TestUtils.createSuite('root');
      const nested = TestUtils.createSuite('nested', root);
      root.suites.push(nested);
      populateTests('root test', root, numRootTests);
      populateTests('nested test', nested, numNestedTests);

      assert.equal(Utils.countTests(root), numRootTests + numNestedTests);
    }));
  });
});

describe('Utils.loop', () => {
  it('should execute each item in order', () => {
    fc.assert(fc.property(fc.array(fc.anything({ values: [ fc.integer(), fc.string(), fc.boolean() ]})), (items) => {
      const stack: unknown[] = [];
      Utils.loop(items, (item, next) => {
        stack.push(item);
        next();
      }, () => {
        assert.deepEqual(stack, items);
      });
    }));
  });
});
