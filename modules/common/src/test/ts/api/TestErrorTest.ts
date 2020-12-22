import { describe, it } from 'mocha';
import { assert } from 'chai';
import * as TestError from '../../../main/ts/api/TestError';

describe('PprintAssertionError.toString()', () => {
  it('includes a diff', () => {
    const actual = TestError.pprintAssertionError('message', 'b', 'a').toString();
    const expected =
      'Test failure: message\n' +
      'Expected:\n' +
      'b\n' +
      'Actual:\n' +
      'a\n' +
      'Diff:\n' +
      '- | a\n' +
      '+ | b';

    assert.deepEqual(actual, expected);
  });
});
