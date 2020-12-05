import Promise from '@ephox/wrap-promise-polyfill';

export interface ResourceLocker {
  readonly execute: <T>(fn: () => PromiseLike<T> | T) => PromiseLike<T>;
}

export const ResourceLocker = (): ResourceLocker => {
  const queue: Array<() => void> = [];
  let locked = false;

  const unlock = () => {
    const callback = queue.shift();
    if (callback !== undefined) {
      setTimeout(callback, 0);
    } else {
      locked = false;
    }
  };

  const lock = (): Promise<void> => {
    if (locked) {
      return new Promise((resolve) => queue.push(resolve));
    } else {
      locked = true;
      return Promise.resolve();
    }
  };

  const execute = <T>(fn: () => PromiseLike<T> | T): PromiseLike<T> => {
    return lock().then(fn).then((result) => {
      unlock();
      return result;
    }, (err) => {
      unlock();
      return Promise.reject(err);
    });
  };

  return {
    execute
  };
};