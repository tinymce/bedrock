import { UnitTest } from '@ephox/bedrock-client';

UnitTest.asyncTest('blah', (_success, _failure) => {
  throw new Error('boo');
});