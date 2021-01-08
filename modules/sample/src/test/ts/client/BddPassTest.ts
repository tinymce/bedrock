import { after, afterEach, assert, before, beforeEach, describe, it, xit } from '@ephox/bedrock-client';

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

    it('should work with async Promise function', async () => {
      assert.eq(1, count);
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    });

    it('should work with retries', () => {
      retryCount++;
      assert.eq(3, retryCount);
    }).retries(2);

    it('should work with tests that contain ?? in the title', () => {
      assert.eq(true, true);
    });

    it.skip('should be skipped with outer call', () => {
      throw new Error('This should never run');
    });

    it('should be skipped with inner call', function () {
      this.skip();
      throw new Error('This should never run');
    });

    xit('should be skipped with xit', () => {
      throw new Error('This should never run');
    });
  });

  describe('skip via beforeEach hooks', () => {
    beforeEach(function () {
      this.skip();
    });

    it('should be skipped', () => {
      throw new Error('This should never run');
    });
  });

  describe('skip via before hooks', () => {
    before(function () {
      this.skip();
    });

    it('should be skipped', () => {
      throw new Error('This should never run');
    });
  });

  describe.skip('skip via describe', () => {
    before(() => {
      throw new Error('This should never run');
    });

    beforeEach(() => {
      throw new Error('This should never run');
    });

    it('should be skipped', () => {
      throw new Error('This should never run');
    });
  });
});
