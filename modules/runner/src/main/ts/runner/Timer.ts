import { noop } from '../core/Utils';

export interface Timer {
  readonly start: (ms: number, timedOutCallback: () => void) => void;
  readonly restart: (ms: number) => void;
  readonly stop: () => void;
  readonly hasTimedOut: () => boolean;
}

export const Timer = (): Timer => {
  let timer: number | undefined;
  let timedOut = false;
  let callback: () => void = noop;

  const startTimer = (ms: number) => {
    timedOut = false;
    timer = setTimeout(() => {
      timedOut = true;
      callback();
    }, ms);
  };

  const stopTimer = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  return {
    start: (ms: number, timedOutCallback: () => void) => {
      callback = timedOutCallback;
      startTimer(ms);
    },
    restart: (ms) => {
      stopTimer();
      startTimer(ms);
    },
    stop: () => {
      stopTimer();
      callback = noop;
    },
    hasTimedOut: () => timedOut
  };
};