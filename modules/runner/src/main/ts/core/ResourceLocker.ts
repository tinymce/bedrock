export interface ResourceLocker {
  readonly async: (fn: (unlock: () => void) => void, next?: () => void) => void;
  readonly sync: (fn: () => void) => void;
}

export const ResourceLocker = (): ResourceLocker => {
  const callbacks: Array< { fn: (unlock: () => void) => void; next?: () => void }> = [];
  let locked = false;

  const unlock = (next?: () => void) => {
    const callback = callbacks.shift();
    if (callback) {
      setTimeout(() => {
        callback.fn(() => unlock(callback.next));
      }, 0);
    } else {
      locked = false;
    }
    if (next !== undefined) {
      next();
    }
  };

  const async = (fn: (unlock: () => void) => void, next?: () => void) => {
    if (locked) {
      callbacks.push({ fn, next });
    } else {
      locked = true;
      fn(() => unlock(next));
    }
  };

  const sync = (fn: () => void) => {
    async((unlock) => {
      fn();
      unlock();
    });
  };

  return {
    async,
    sync
  };
};