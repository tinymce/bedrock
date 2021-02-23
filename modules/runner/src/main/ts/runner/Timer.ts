export interface Timer {
  readonly start: (ms: number) => void;
  readonly restart: (ms: number) => void;
  readonly stop: () => void;
  readonly hasTimedOut: () => boolean;
}

export const Timer = (callback: () => void): Timer => {
  let timer: number | undefined;
  let timedOut = false;

  const start = (ms: number) => {
    timer = setTimeout(() => {
      timedOut = true;
      callback();
    }, ms);
  };

  const stop = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  return {
    start,
    restart: (ms) => {
      stop();
      start(ms);
    },
    stop,
    hasTimedOut: () => timedOut
  };
};