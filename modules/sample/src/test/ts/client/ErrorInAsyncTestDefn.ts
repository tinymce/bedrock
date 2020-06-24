import { UnitTest } from '@ephox/bedrock-client';

UnitTest.asyncTest('blah', (success, failure) => {
  throw new Error('boo');
});