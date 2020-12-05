import Promise from '@ephox/wrap-promise-polyfill';
import { assert } from 'chai';
import { describe, it } from 'mocha';
import { ResourceLocker } from '../../../main/ts/core/ResourceLocker';

describe('ResourceLocker.execute', () => {
  let locker: ResourceLocker;

  beforeEach(() => {
    locker = ResourceLocker();
  });

  it('should execute in order - sync', () => {
    const calls: string[] = [];
    locker.execute(() => calls.push('1'));
    locker.execute(() => calls.push('2'));
    locker.execute(() => calls.push('3'));

    return locker.execute(() => {
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

    locker.execute(() => delayedCall('1', 100));
    locker.execute(() => delayedCall('2', 50));
    locker.execute(() => delayedCall('3', 0));

    return locker.execute(() => {
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

    locker.execute(() => delayedCall('1', 50));
    locker.execute(() => calls.push('2'));
    locker.execute(() => delayedCall('3', 25));
    locker.execute(() => calls.push('4'));

    return locker.execute(() => {
      assert.sameOrderedMembers(calls, [ '1', '2', '3', '4' ]);
    });
  }).slow(100);
});