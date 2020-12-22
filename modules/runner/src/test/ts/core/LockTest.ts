import Promise from '@ephox/wrap-promise-polyfill';
import { assert } from 'chai';
import { describe, it } from 'mocha';
import { Lock } from '../../../main/ts/core/Lock';

describe('Lock.execute', () => {
  let lock: Lock;

  beforeEach(() => {
    lock = Lock();
  });

  it('should execute in order - sync', () => {
    const calls: string[] = [];
    lock.execute(() => calls.push('1'));
    lock.execute(() => calls.push('2'));
    lock.execute(() => calls.push('3'));

    return lock.execute(() => {
      assert.sameOrderedMembers(calls, [ '1', '2', '3' ]);
    });
  });

  it('should execute in order - async', () => {
    const calls: string[] = [];
    const delayedCall = (id: string, timeout: number) => new Promise((resolve) => {
      setTimeout(() => {
        calls.push(id);
        resolve();
      }, timeout);
    });

    lock.execute(() => delayedCall('1', 100));
    lock.execute(() => delayedCall('2', 50));
    lock.execute(() => delayedCall('3', 0));

    return lock.execute(() => {
      assert.sameOrderedMembers(calls, [ '1', '2', '3' ]);
    });
  }).slow(200);

  it('should execute in order - mixed', () => {
    const calls: string[] = [];
    const delayedCall = (id: string, timeout: number) => new Promise((resolve) => {
      setTimeout(() => {
        calls.push(id);
        resolve();
      }, timeout);
    });

    lock.execute(() => delayedCall('1', 50));
    lock.execute(() => calls.push('2'));
    lock.execute(() => delayedCall('3', 25));
    lock.execute(() => calls.push('4'));

    return lock.execute(() => {
      assert.sameOrderedMembers(calls, [ '1', '2', '3', '4' ]);
    });
  }).slow(100);
});