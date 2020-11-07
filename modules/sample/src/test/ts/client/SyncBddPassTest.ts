import { Bdd, assert } from '@ephox/bedrock-client'

Bdd.describe('BDD Sync Pass', () => {
  Bdd.describe('Test count', () => {
    let count = 0;

    Bdd.beforeEach(() => {
      count++;
    });

    Bdd.it('should be 1', () => {
      assert.eq(1, count);
    });

    Bdd.it('should be 2', (done) => {
      setTimeout(() => {
        assert.eq(2, count);
        done();
      }, 1000);
    });

    Bdd.it('should be 3', () => {
      assert.eq(3, count);
    });
  });
});
