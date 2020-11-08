import { after, afterEach, assert, before, beforeEach, describe, it } from '@ephox/bedrock-client';

describe('BDD Sync Pass', () => {
  describe('Test count', () => {
    let count = 0;

    before(() => {
      console.log('before');
    });

    beforeEach(() => {
      console.log('before each');
      count++;
    });

    after(() => {
      console.log('after');
    });

    afterEach(() => {
      console.log('after each');
    });

    it('should be 1', () => {
      assert.eq(1, count);
    });

    it('should be 2', (done) => {
      assert.eq(2, count);
      setTimeout(done, 100);
    });

    it('should be 3', () => {
      assert.eq(3, count);
    });
  });
});
