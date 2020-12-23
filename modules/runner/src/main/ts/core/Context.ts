import { Context, Runnable, Test } from '@ephox/bedrock-common';

export const createContext = (runnable: Runnable, currentTest?: Test): Context => ({
  current: runnable,
  currentTest,
  skip: runnable.skip,
  retries: runnable.retries,
  slow: runnable.slow,
  timeout: runnable.timeout
});