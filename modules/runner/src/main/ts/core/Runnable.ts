import { ExecuteFn, Runnable, RunnableState } from '@ephox/bedrock-common';
import { SkipError } from '../errors/Errors';

export const createRunnable = (title: string, fn: ExecuteFn | undefined): Runnable => {
  let retries = -1;
  let timeout = -1;
  let slow = 75;
  let state = RunnableState.NotRun;
  const listeners: Record<string, Set<(value: number) => void>> = {};

  const fireChange = (type: string, value: number) => {
    if (listeners.hasOwnProperty(type)) {
      listeners[type].forEach((listener) => {
        listener(value);
      });
    }
  };

  const runnable: Runnable = {
    fn,
    title,

    isFailed: () => state === RunnableState.Failed,
    isSkipped: () => state === RunnableState.Skipped,
    isPassed: () => state === RunnableState.Passed,
    setResult: (s, e) => {
      state = s;
      runnable.error = e;
    },
    skip: () => {
      throw new SkipError('skip manually called');
    },
    retries: (retry?: number): any => {
      if (retry !== undefined) {
        fireChange('retries', retry);
        retries = retry;
        return runnable;
      } else {
        return retries;
      }
    },
    slow: (ms?: number): any => {
      if (ms !== undefined) {
        fireChange('slow', ms);
        slow = ms;
        return runnable;
      } else {
        return slow;
      }
    },
    timeout: (ms?: number): any => {
      if (ms !== undefined) {
        fireChange('timeout', ms);
        timeout = ms;
        return runnable;
      } else {
        return timeout;
      }
    },
    _onChange: (type, callback) => {
      if (!listeners.hasOwnProperty(type)) {
        listeners[type] = new Set();
      }
      listeners[type].add(callback);
      return () => {
        listeners[type].delete(callback);
      };
    }
  };
  return runnable;
};