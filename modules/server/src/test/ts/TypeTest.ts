import * as fc from 'fast-check';
import { assert } from 'chai';
import { describe, it } from 'mocha';
import * as Type from '../../main/ts/bedrock/util/Type';

describe('Type.isString', () => {
  it('is true for strings', () => {
    fc.assert(fc.property(fc.string(), Type.isString));
  });

  it('is false for undefined', () => {
    assert.isFalse(Type.isString(undefined));
  });
});
