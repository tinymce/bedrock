import { TestLabel } from "./TestLabel";
import { TestLogEntry, TestLogs } from "./TestLogs";

export type SuccessCallback = () => void;
export type TestError = TestLabel | Error;
export type FailureCallback = (error: TestError, logs?: TestLogs) => void;

const Global = (function () {
  if (typeof window !== 'undefined') {
    return window;
  } else {
    return Function('return this;')();
  }
})();

const register = (name: string, test: (success: () => void, failure: (e: string | LoggedError) => void) => void) => {
  if (typeof Global.__tests === 'undefined') {
    Global.__tests = [];
  }

  Global.__tests.push({name: name, test: test});
};

const cleanStack = (error, linesToRemove = 1) => {
  if (error.stack === undefined) {
    return '';
  }

  const lines = error.stack.split('\n');
  const message = lines[0];
  const stack = lines.slice(1 + linesToRemove);
  return message + '\n' + stack.join('\n');
};

interface ReportedError extends Error {
  toString: () => string;
}

interface LoggedError extends ReportedError {
  logs: string[]
}

const reportedError = (message: string, stack: string, name: string): ReportedError => ({
  message,
  stack,
  name,
  toString: () => stack
});

const normalizeError = (err: TestError): ReportedError => {
  if (typeof err === 'string') {
    // Create an error object, but strip the stack of the 2 latest calls as it'll
    // just be this function and the previous function that called this (ie asyncTest)
    const error = new Error(err);
    const stack = cleanStack(error, 2);
    return reportedError(error.message, stack, error.name);
  } else if (typeof err === 'function') {
    return normalizeError(err());
  } else if (err instanceof Error) {
    return reportedError(err.message, err.stack, err.name);
  }
};

const processLog = (err: ReportedError, logs: TestLogs): LoggedError => {
  const outputToStr = function (numIndent: number, entries: TestLogEntry[]) {
    let everything = [ ];
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

  return {
    ...err,
    logs: outputToStr(2, logs.history)
  };
};

export const asynctest = (name: string, test: (success: SuccessCallback, failure: FailureCallback) => void) => {
  register(name, function (success: () => void, failure: (e: string | LoggedError) => void) {
    test(success, function (err: TestError, logs: TestLogs = TestLogs.emptyLogs()) {
      const normalizedErr = normalizeError(err);
      const failureMessage = processLog(normalizedErr, logs);
      failure(failureMessage);
    });
  });
};


export const test = (name: string, test: SuccessCallback) => {
  register(name, function (success, failure) {
    try {
      test();
      success();
    } catch (e) {
      failure(e);
    }
  });
};

export const domtest = (name: string, test: () => Promise<void>): void => {
  register(name, function (success, failure) {
    // This would later include setup/teardown of jsdoc for atomic tests
    const promise = test();

    if (!(promise instanceof Global.Promise)) {
      throw 'dom tests must return a promise';
    }

    promise.then(function () {
      success();
    }, failure);
  });
};
