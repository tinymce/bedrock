import { Global } from '@ephox/bedrock-common';
import { assert } from 'chai';
import * as fc from 'fast-check';
import { beforeEach, describe, it, Test } from 'mocha';
import * as Register from '../../../main/ts/core/Register';
import { range } from '../TestUtils';

describe('Register.test', () => {
  beforeEach(() => {
    Global.__tests = [];
  });

  it('should add the test to the __tests global', () => {
    const test = new Test('test');
    Register.test(test);

    assert.lengthOf(Global.__tests, 1);
    assert.sameMembers(Global.__tests, [ test ]);
  });

  it('should not re-register tests', () => {
    const test = new Test('test');
    Register.test(test);
    Register.test(test);

    assert.lengthOf(Global.__tests, 1);
    assert.sameMembers(Global.__tests, [ test ]);
  });

  it('should register tests in order', () => {
    fc.assert(fc.property(fc.nat(50), (numTests) => {
      Global.__tests = [];
      const tests = range(numTests, (i) => new Test(`test ${i}`));
      tests.forEach(Register.test);

      assert.lengthOf(Global.__tests, numTests);
      assert.sameOrderedMembers(Global.__tests, tests);
    }));
  });
});