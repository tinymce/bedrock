import { TestLabel } from "./TestLabel";
import { TestLogEntry, TestLogs } from "./TestLogs";
import { TestError, LoggedError } from '@ephox/bedrock-common';

type TestError = TestError.TestError;
type LoggedError = LoggedError.LoggedError;

export type HtmlDiffError = TestError.HtmlDiffAssertionError;

export type SuccessCallback = () => void;
export type TestThrowable = TestLabel | TestError;
export type FailureCallback = (error: TestThrowable, logs?: TestLogs) => void;

const Global = (function () {
  if (typeof window !== 'undefined') {
    return window;
  } else {
    return Function('return this;')();
  }
})();

const register = (name: string, test: (success: () => void, failure: (e: LoggedError) => void) => void) => {
  if (typeof Global.__tests === 'undefined') {
    Global.__tests = [];
  }

  Global.__tests.push({name: name, test: test});
};

const cleanStack = (error: Error, linesToRemove = 1) => {
  if (error.stack === undefined) {
    return '';
  }

  const lines = error.stack.split('\n');
  const message = lines[0];
  const stack = lines.slice(1 + linesToRemove);
  return message + '\n' + stack.join('\n');
};

const normalizeError = (err: TestThrowable): TestError => {
  if (typeof err === 'string') {
    // Create an error object, but strip the stack of the 2 latest calls as it'll
    // just be this function and the previous function that called this (ie asyncTest)
    const error = new Error(err);
    error.stack = cleanStack(error, 2);
    return error;
  } else if (typeof err === 'function') {
    return normalizeError(err());
  } else {
    return err;
  }
};

const processLog = (logs: TestLogs): string[] => {
  const outputToStr = function (numIndent: number, entries: TestLogEntry[]) {
    let everything: string[] = [ ];
    let indentString = '';
    for (let i = 0; i < numIndent; i++) {
      indentString += ' ';
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const output = (() => {
        const traceLines = entry.trace === null || typeof entry.trace !== 'string' ? [ ] : [ '', '', '' ].concat(entry.trace.split('\n'));

        if (entry.entries.length === 0) {
          if (entry.trace === null) {
            return [ indentString + '*  ' + entry.message ];
          } else {
            return [ indentString + '*  ' + entry.message ].concat(traceLines);
          }
        } else {
          // We have entries ... let's format them.
          return [ indentString + '*  ' + entry.message ].concat(
            outputToStr(numIndent + 2, entry.entries)
          ).concat(traceLines);
        }
      })();
      everything = everything.concat(output)
    }
    return everything;
  };

  return outputToStr(2, logs.history);
};

const prepFailure = (err: TestThrowable, logs: TestLogs = TestLogs.emptyLogs()): LoggedError => {
  const normalizedErr = normalizeError(err);
  const failureMessage = processLog(logs);
  return {
    error: normalizedErr,
    logs: failureMessage,
  }
};

export const asynctest = (name: string, test: (success: SuccessCallback, failure: FailureCallback) => void) => {
  register(name, function (success: () => void, failure: (e: LoggedError) => void) {
    test(success, function (err: TestThrowable, logs: TestLogs = TestLogs.emptyLogs()) {
      const r = prepFailure(err, logs);
      failure(r);
    });
  });
};

export const test = (name: string, test: () => void) => {
  register(name, function (success: () => void, failure: (e: LoggedError) => void) {
    try {
      test();
      success();
    } catch (e) {
      const r = prepFailure(e);
      failure(r);
    }
  });
};
