import { UnitTest } from '@ephox/bedrock-client';
import Promise from '@ephox/wrap-promise-polyfill';

UnitTest.asyncTest('AsyncFail Test 1', (success, failure) => {
  setTimeout(() => {
    failure('failed');
  }, 100);
});

const asyncFail = () =>
  new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      reject('failed');
    }, 100);
  });

const asyncPass = () =>
  new Promise<void>((resolve, _reject) => {
    setTimeout(() => {
      resolve();
    }, 100);
  });

UnitTest.promiseTest('AsyncFail Test 2', () => asyncPass().then(asyncFail));
