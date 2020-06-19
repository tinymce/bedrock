import { UnitTest } from '@ephox/bedrock-client'

UnitTest.asyncTest('AsyncFail Test 1', (success, failure) => {
  setTimeout(() => {
    failure('failed');
  }, 100);
});

const asyncFail = () =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      reject('failed');
    }, 100);
  });

const asyncPass = () =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 100);
  });

UnitTest.promiseTest('AsyncFail Test 2', async () => {
  await asyncPass();
  await asyncFail();
});
