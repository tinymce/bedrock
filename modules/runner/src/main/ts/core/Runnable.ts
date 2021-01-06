import { ExecuteFn, Runnable, RunnableState } from '@ephox/bedrock-common';
import { SkipError } from './Errors';

export const createRunnable = (title: string, fn: ExecuteFn | undefined): Runnable => {
  let retries = -1;
  let timeout = -1;
  let slow = 75;
  let state = RunnableState.NotRun;

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
        retries = retry;
        return runnable;
      } else {
        return retries;
      }
    },
    slow: (ms?: number): any => {
      if (ms !== undefined) {
        slow = ms;
        return runnable;
      } else {
        return slow;
      }
    },
    timeout: (ms?: number): any => {
      if (ms !== undefined) {
        timeout = ms;
        return runnable;
      } else {
        return timeout;
      }
    }
  };
  return runnable;
};