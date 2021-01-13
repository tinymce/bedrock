import { assert } from 'chai';
import * as SettingsResolver from '../../main/ts/bedrock/core/SettingsResolver';

describe('SettingsResolver', () => {
  describe('resolve', () => {
    it('filters into buckets', () => {

      const check = (bucket: number, buckets: number, testfiles: string[], expected: string[]) => {
        assert.deepEqual(SettingsResolver.resolve({ bucket, buckets, testfiles, frog: 'chicken' }), { bucket, buckets, testfiles: expected, frog: 'chicken' });
      };

      check(1, 3, ['a'], ['a']);
      check(2, 3, ['a'], []);
      check(3, 3, ['a'], []);

      check(1, 3, ['a', 'b'], ['a']);
      check(2, 3, ['a', 'b'], ['b']);
      check(3, 3, ['a', 'b'], []);

      check(1, 3, ['a', 'b', 'c'], ['a']);
      check(2, 3, ['a', 'b', 'c'], ['b']);
      check(3, 3, ['a', 'b', 'c'], ['c']);

      check(1, 3, ['a', 'b', 'c', 'd'], ['a', 'd']);
      check(2, 3, ['a', 'b', 'c', 'd'], ['b']);
      check(3, 3, ['a', 'b', 'c', 'd'], ['c']);

      check(1, 3, ['a', 'b', 'c', 'd', 'e'], ['a', 'd']);
      check(2, 3, ['a', 'b', 'c', 'd', 'e'], ['b', 'e']);
      check(3, 3, ['a', 'b', 'c', 'd', 'e'], ['c']);

      check(1, 3, ['a', 'b', 'c', 'd', 'e', 'f'], ['a', 'd']);
      check(2, 3, ['a', 'b', 'c', 'd', 'e', 'f'], ['b', 'e']);
      check(3, 3, ['a', 'b', 'c', 'd', 'e', 'f'], ['c', 'f']);
    });
  });
});
