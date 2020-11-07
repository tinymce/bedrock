import { assert } from 'chai';
import * as fc from 'fast-check';
import { afterEach, describe, it } from 'mocha';
import * as UnitTest from '../../../main/ts/api/UnitTest';

const Global: any = global;

const assertRegistryState = (testName: string, expectedSize: number) => {
  assert.lengthOf(Global.__tests, expectedSize);
  assert.lengthOf(Global.__suites, expectedSize);
  const test = Global.__tests[expectedSize - 1];
  const suite = Global.__suites[expectedSize - 1];

  assert.containsAllKeys(test, [ 'name', 'suite', 'test' ]);
  assert.propertyVal(test, 'name', testName);
  assert.propertyVal(test, 'suite', suite);

  assert.containsAllKeys(suite, [ 'name', 'tests', 'suites' ]);
  assert.propertyVal(suite, 'name', testName);
  assert.lengthOf(suite.suites, 0);
  assert.lengthOf(suite.tests, 1);
};

describe('UnitTest.test', () => {
  afterEach(() => {
    delete Global.__tests;
    delete Global.__suites;
  });

  it('registered in the global registry', () => {
    fc.assert(fc.property(fc.string(), (testName) => {
      const initialSize = Global.__tests?.length || 0;
      UnitTest.test(testName, () => testName);
      assertRegistryState(testName, initialSize + 1);
    }));
  });
});

describe('UnitTest.asyncTest', () => {
  afterEach(() => {
    delete Global.__tests;
    delete Global.__suites;
  });

  it('registered in the global registry', () => {
    fc.assert(fc.property(fc.string(), (testName) => {
      const initialSize = Global.__tests?.length || 0;
      UnitTest.asyncTest(testName, () => testName);
      assertRegistryState(testName, initialSize + 1);
    }));
  });
});