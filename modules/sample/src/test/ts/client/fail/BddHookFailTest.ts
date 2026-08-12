import { after, before, describe, it } from '@ephox/bedrock-client';

describe('BDD Hook Fail', () => {
  describe('Rejected promise in before', () => {
    before(() => Promise.reject(new Error('before hook rejected')));

    it('should not run', () => {
      console.log('this test should not have run');
    });
  });

  describe('Exception in after', () => {
    after(() => {
      throw new Error('after hook threw');
    });

    it('should run', () => {
      console.log('after hook test');
    });
  });
});
