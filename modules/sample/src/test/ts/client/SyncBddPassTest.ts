import { after, afterEach, assert, before, beforeEach, it } from '@ephox/bedrock-client';

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

    it.skip('should be skipped 1', () => {
      assert.eq(-1, count);
    });

    it('should be skipped 2', function () {
      this.skip();
      assert.eq(-1, count);
    });
  });
});
