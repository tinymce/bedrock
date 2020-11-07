import { Tests } from '@ephox/bedrock-common';

const Global = (function () {
  if (typeof window !== 'undefined') {
    return window;
  } else {
    return Function('return this;')();
  }
})();

export const test = (test: Tests.Test): void => {
  if (typeof Global.__tests === 'undefined') {
    Global.__tests = [];
  }

  Global.__tests.push(test);
};

export const suite = (suite: Tests.Suite): void => {
  if (typeof Global.__suites === 'undefined') {
    Global.__suites = [];
  }

  Global.__suites.push(suite);
};