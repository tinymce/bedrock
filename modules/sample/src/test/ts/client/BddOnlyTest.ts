import { afterEach, assert, beforeEach, describe, it } from '@ephox/bedrock-client';

describe('BDD Only', () => {
  let count = 0;

  beforeEach(() => count++);
  afterEach(() => count--);

  describe.only('Only suite', () => {
    it.only('should work with only function', () => {
      assert.eq(1, count);
    });

    it('should not run normal tests', () => {
      throw new Error('This should never run');
    });
  });

  describe('Normal suite', () => {
    it('should not run normal tests', () => {
      throw new Error('This should never run');
    });
  });
});
