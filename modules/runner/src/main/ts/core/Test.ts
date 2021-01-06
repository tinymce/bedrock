import { Suite, ExecuteFn, Test } from '@ephox/bedrock-common';
import * as Runnable from './Runnable';
import { getFullTitle } from './Utils';

export const createTest = (title: string, fn: ExecuteFn, parent?: Suite): Test => {
  const runnable = Runnable.createRunnable(title, fn);
  const test: Test = {
    ...runnable,
    parent,
    _only: false,
    setResult: (state, e) => {
      runnable.setResult(state, e);
      test.error = e;
    },
    isSkipped: () => {
      return runnable.isSkipped() || parent?.isSkipped() === true;
    },
    fullTitle: () => getFullTitle(test, '-')
  };
  return test;
};