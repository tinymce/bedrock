import { after, afterEach, assert, before, beforeEach, it } from '@ephox/bedrock-client';

describe('BDD Pass', () => {
  describe('Test count', () => {
    let count = 0;
    let retryCount = 0;

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
      count--;
    });

    it('should work with sync function', () => {
      assert.eq(1, count);
    });

    it('should work with async done function', (done) => {
      assert.eq(1, count);
      setTimeout(done, 100);
    });

    it('should work with retries', () => {
      retryCount++;
      assert.eq(3, retryCount);
    }).retries(2);

    it.skip('should be skipped with outer call', () => {
      throw new Error('This should never run');
    });

    it('should be skipped with inner call', function () {
      this.skip();
      throw new Error('This should never run');
    });
  });
});
