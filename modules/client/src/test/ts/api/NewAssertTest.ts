import { TestError } from '@ephox/bedrock-common';
import { Testable } from '@ephox/dispute';
import * as chai from 'chai';
import * as fc from 'fast-check';
import { describe, it } from 'mocha';
import { Assert } from '../../../main/ts/api/Main';

const { tArray, tString } = Testable;

describe('Assert.eq', () => {
  it('does not throw when assertion passes', () => {
    fc.assert(fc.property(fc.integer(), (i) => {
      Assert.eq('blah', i, i);
      return true;
    }));

    fc.assert(fc.property(fc.array(fc.string()), (xs) => {
      Assert.eq('blah', xs, xs);
      Assert.eq('blah', xs, xs.slice());
      Assert.eq('blah', xs, xs.slice(), tArray(tString));
      return true;
    }));
  });

  it('throws when assertion fails', () => {
    Assert.throws('throws', () => {
      Assert.eq('blah', 'a', 'b');
    });
  });

  it('throws a PprintAssertionError', () => {
    try {
      Assert.eq('blah', 'a', 'b');
    } catch (e) {
      const ee = e as TestError.PprintAssertionError;
      chai.assert.deepEqual(ee.message, 'blah');
      chai.assert.deepEqual(ee.diff.actual, '"b"');
      chai.assert.deepEqual(ee.diff.expected, '"a"');
    }
  });
});
