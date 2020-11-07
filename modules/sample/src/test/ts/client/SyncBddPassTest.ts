import { Bdd, assert } from '@ephox/bedrock-client';

Bdd.describe('BDD Sync Pass', () => {
  Bdd.describe('Test count', () => {
    let count = 0;

    Bdd.before(() => {
      console.log('before');
    });

    Bdd.beforeEach(() => {
      console.log('before each');
      count++;
    });

    Bdd.after(() => {
      console.log('after');
    });

    Bdd.afterEach(() => {
      console.log('after each');
    });

    Bdd.it('should be 1', () => {
      assert.eq(1, count);
    });

    Bdd.it('should be 2', (done) => {
      assert.eq(2, count);
      setTimeout(done, 100);
    });

    Bdd.it('should be 3', () => {
      assert.eq(3, count);
    });
  });
});
