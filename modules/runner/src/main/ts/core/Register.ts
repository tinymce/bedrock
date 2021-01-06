import { Global, Test } from '@ephox/bedrock-common';

const isMarked = (test: Test): boolean => {
  return (test as any).__registered === true;
};

const mark = (test: Test): void => {
  (test as any).__registered = true;
};

export const test = (test: Test): void => {
  if (typeof Global.__tests === 'undefined') {
    Global.__tests = [];
  }

  // Mark the test to ensure we don't register it twice
  if (!isMarked(test)) {
    mark(test);
    Global.__tests.push(test);
  }
};