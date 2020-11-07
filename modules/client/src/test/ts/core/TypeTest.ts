import { assert } from 'chai';
import * as fc from 'fast-check';
import { describe, it } from 'mocha';
import * as Type from '../../../main/ts/core/Type';

describe('Type.typeOf', () => {
  it('is "string" for strings', () => {
    fc.assert(fc.property(fc.string(), (str) => {
      assert.equal(Type.typeOf(str), 'string');
    }));
  });

  it('is "array" for arrays', () => {
    fc.assert(fc.property(fc.array(fc.anything()), (arr) => {
      assert.equal(Type.typeOf(arr), 'array');
    }));
  });

  it('is "boolean" for bools', () => {
    fc.assert(fc.property(fc.boolean(), (bool) => {
      assert.equal(Type.typeOf(bool), 'boolean');
    }));
  });

  it('is "object" for object', () => {
    fc.assert(fc.property(fc.object(), (obj) => {
      assert.equal(Type.typeOf(obj), 'object');
    }));
  });
});
