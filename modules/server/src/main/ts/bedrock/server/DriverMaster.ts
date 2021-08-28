import * as Waiter from '../util/Waiter';

type Executor<T> = () => Promise<T>;

interface QueueItem<T> {
  readonly f: Executor<T>;
  readonly label: string;
  readonly identifier: string;
}

export interface DriverMaster {
  readonly waitForIdle: <T>(f: Executor<T>, label: string) => Promise<T>;
}

export const create = (): DriverMaster => {
  let inUse = false;

  let queue: QueueItem<any>[] = [];

  const use = <T>(f: Executor<T>) => {
    inUse = true;

    try {
      return f();
    } finally {
      inUse = false;
    }
  };

  /*
   * DriverMaster is a very naive locking / unlocking system for access
   * to the webdriver. The goal of it is to overcome the situation where
   * the IEDriver begins to interleave executeScript requests, and gets
   * the responses out of order (causing a lot of fragility)
   *
   * The basic approach is this:
   * - a state variable called inUse. This is set to true only while
   *   there is a process currently locking the webdriver
   * - a state variable called queue. This is an *ordered* list of which
   *   processes have requested access to the webdriver
   *
   * The only outside API is waitForIdle which takes the process and a label
   * (for debugging). It will return a promise. That promise will include either
   * a lock, or waiting for a lock. Locks will be granted immediately when:
   *
   * - the queue is empty and there is no current lock
   * - the requester has the same identifier as the head of the queue, and there is no
   *   current lock
   * - some number of attempts to gain access have failed. This situation is basically
   *   just there because I know there will be bugs in releasing the lock.
   *
   * The process will need to wait a while and try again for a lock when:
   *
   * - the queue is not empty and the head of the queue does not match the process
   *   identifier
   *
   * In this way, the queue is designed to allow processes to gain lock access in the
   * order they requested it. If they can't gain access, they stay at the head of the
   * queue and try again later. Something which is not at the head of a non-empty queue
   * should not be able to gain a lock before the head of the queue. This is to prevent
   * a process fortuitously constantly getting the lock because of how the delays
   * fall out.
   */

  const doWaitForIdle = async <T>(identifier: string, f: Executor<T>, label: string, attempts: number): Promise<T> => {
    // Locking has failed many times ... so just assume the lock should have been released.
    if (attempts === 0) return use(f);
    // Nothing has a lock, and there is no queue
    if (!inUse && queue.length === 0) return use(f);
    // Nothing has a lock and this process is at the head of the queue
    else if (!inUse && queue[0].identifier === identifier) {
      const first = queue[0];
      queue = queue.slice(1);
      return use(first.f);
    // Either something has a lock, or this process is not at the head of the queue,
    // so it needs to wait its turn
    } else {
      await Waiter.delay({}, 100);
      return doWaitForIdle(identifier, f, label, attempts - 1);
    }
  };

  const waitForIdle = <T>(f: Executor<T>, label: string): Promise<T> => {
    if (!inUse && queue.length === 0) {
      return use(f);
    } else {
      const identifier = label + '_' + new Date().getTime() + Math.floor(Math.random() * 10000);
      queue = queue.concat({
        f,
        label,
        identifier
      });
      return doWaitForIdle(identifier, f, label, 100);
    }
  };

  return {
    waitForIdle
  };
};
