import { Hook } from '@ephox/bedrock-common';
import { assert } from 'chai';
import * as fc from 'fast-check';
import { afterEach, describe, it } from 'mocha';
import * as Bdd from '../../../main/ts/api/Bdd';

const Global: any = global;

const assertSuiteRegistryState = (suiteName: string, expectedSize: number) => {
  assert.lengthOf(Global.__suites, expectedSize);
  const suite = Global.__suites[expectedSize - 1];

  assert.containsAllKeys(suite, [ 'name', 'suites', 'tests', 'hooks' ]);
  assert.propertyVal(suite, 'name', suiteName);
};

const assertTestRegistryState = (testName: string, expectedSize: number) => {
  assert.lengthOf(Global.__tests, expectedSize);
  const test = Global.__tests[expectedSize - 1];

  assert.containsAllKeys(test, [ 'name', 'suite', 'test' ]);
  assert.propertyVal(test, 'name', testName);
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

describe('Bdd.describe', () => {
  afterEach(() => {
    delete Global.__suites;
    delete Global.__tests;
  });

  it('registered in the global registry', () => {
    fc.assert(fc.property(fc.string(), (suiteName) => {
      const initialSize = Global.__suites?.length || 0;
      Bdd.describe(suiteName, () => suiteName);
      assertSuiteRegistryState(suiteName, initialSize + 1);
    }));
  });

  it('should allow nested describes', () => {
    Bdd.describe('parent', () => {
      Bdd.describe('child', noop);
    });

    assertSuiteRegistryState('parent', 1);
    const rootSuite = Global.__suites[0];
    assert.lengthOf(rootSuite.suites, 1);
    const childSuite = rootSuite.suites[0];
    assert.equal(childSuite.name, 'parent / child');
  });

  it('should allow hooks to be configured', () => {
    Bdd.describe('test', () => {
      Bdd.before(noop);
      Bdd.beforeEach(noop);

      Bdd.after(noop);
      Bdd.afterEach(noop);
    });

    assertSuiteRegistryState('test', 1);
    const rootSuite = Global.__suites[0];
    assert.lengthOf(rootSuite.hooks[Hook.Before], 1);
    assert.lengthOf(rootSuite.hooks[Hook.BeforeEach], 1);
    assert.lengthOf(rootSuite.hooks[Hook.After], 1);
    assert.lengthOf(rootSuite.hooks[Hook.AfterEach], 1);
  });

  it('should allow tests', () => {
    Bdd.describe('root', () => {
      Bdd.it('test', noop);
    });

    assertSuiteRegistryState('root', 1);
    assertTestRegistryState('root test', 1);
    const rootSuite = Global.__suites[0];
    assert.lengthOf(rootSuite.tests, 1);
    const test = rootSuite.tests[0];
    assert.equal(test.suite, rootSuite);
  });
});

describe('Bdd.it', () => {
  const suiteName = 'test it';

  afterEach(() => {
    delete Global.__tests;
    delete Global.__suites;
  });

  it('registered in the global registry', () => {
    Bdd.describe(suiteName, () => {
      fc.assert(fc.property(fc.string(), (testName) => {
        const initialSize = Global.__tests?.length || 0;
        Bdd.it(testName, (done) => {
          done();
        });
        assertTestRegistryState(suiteName + ' ' + testName, initialSize + 1);
      }));
    });
  });

  it('sync test function should be wrapped', (done) => {
    Bdd.describe(suiteName, () => {
      Bdd.it('sync test', noop);
    });

    assertTestRegistryState(suiteName + ' sync test', 1);
    const test = Global.__tests[0];
    assert.lengthOf(test.test, 2); // success, failure
    test.test(done, done);
  });

  it('async test function should be wrapped', (done) => {
    Bdd.describe(suiteName, () => {
      Bdd.it('async test', (done) => done());
    });

    assertTestRegistryState(suiteName + ' async test', 1);
    const test = Global.__tests[0];
    assert.lengthOf(test.test, 2); // success, failure
    test.test(done, done);
  });

  it('should include logs on failure', (done) => {
    Bdd.describe(suiteName, () => {
      Bdd.it('failure test', () => {
        throw new Error('Failure');
      });
    });

    assertTestRegistryState(suiteName + ' failure test', 1);
    const test = Global.__tests[0];
    assert.lengthOf(test.test, 2); // success, failure
    test.test(done, (e: { error: Error, logs: string[] }) => {
      const { error, logs } = e;
      assert.equal(error.message, 'Failure');
      assert.isNotNull(error.stack);

      assert.isAtLeast(logs.length, 2);
      const rootLogEntry = logs[0];
      assert.equal(rootLogEntry, '  *  ' + suiteName);
      const testLogEntry = logs[1];
      assert.equal(testLogEntry, '    *  failure test');

      done();
    });
  });
});