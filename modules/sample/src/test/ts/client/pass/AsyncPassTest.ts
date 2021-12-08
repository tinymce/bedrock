import { UnitTest } from '@ephox/bedrock-client';
import Promise from '@ephox/wrap-promise-polyfill';

UnitTest.asyncTest('AsyncPass Test 1', (success, _failure) => {
  new Promise<void>(function (resolve, _reject) {
    setTimeout(function () {
      resolve();
    }, 100);
  }).then(success);
});

const asyncFn = () => new Promise<void>((resolve, _reject) => {
  setTimeout(function () {
    resolve();
  }, 100);
});

UnitTest.asyncTest('AsyncPass Test 2', (success, failure) => {
  asyncFn().then(success).catch(failure);
});

UnitTest.promiseTest('AsyncPass Test 3', () =>
  asyncFn().then(asyncFn)
);
