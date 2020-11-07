import { LoggedError } from '@ephox/bedrock-common';

type LoggedError = LoggedError.LoggedError;

const Global = (function () {
  if (typeof window !== 'undefined') {
    return window;
  } else {
    return Function('return this;')();
  }
})();

export const register = (name: string, test: (success: () => void, failure: (e: LoggedError) => void) => void) => {
  if (typeof Global.__tests === 'undefined') {
    Global.__tests = [];
  }

  Global.__tests.push({name: name, test: test});
};