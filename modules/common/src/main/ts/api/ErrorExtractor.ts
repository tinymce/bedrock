import * as Differ from './Differ';
import * as TestError from './TestError';
import * as LoggedError from './LoggedError';

type LoggedError = LoggedError.LoggedError;

type TestError = TestError.TestError;
type PprintAssertionError = TestError.PprintAssertionError;
type HtmlDiffAssertionError = TestError.HtmlDiffAssertionError;
type AssertionError = TestError.AssertionError;

export interface BasicErrorData {
  readonly type: string;
  readonly message: string;
  readonly diff?: {
    readonly expected: string;
    readonly actual: string;
    readonly comparison: string;
  };
}

export interface ErrorData extends BasicErrorData {
  readonly logs?: string;
  readonly stack?: string;
}

const stringify = (e: any) => {
  if (e === undefined) {
    return 'undefined';
  } else if (typeof e === 'string') {
    return e;
  } else {
    return JSON.stringify(e);
  }
};

const extractError = (err?: LoggedError): TestError =>
  err === undefined ? new Error('no error given') : err;

const extractStack = (e: TestError): string => {
  if (e.stack) {
    return e.stack.split('\n')
      .filter((line) => line.indexOf('at') !== -1)
      .join('\n');
  } else {
    return '';
  }
};

const extractErrorData = (e: HtmlDiffAssertionError | PprintAssertionError): BasicErrorData => {
  const actual = e.diff.actual;
  const expected = e.diff.expected;
  const comparison = TestError.isHTMLDiffError(e) ? e.diff.comparison : Differ.diffPrettyText(actual, expected);
  return ({
    type: e.name,
    message: `Test failure: ${e.message}`,
    diff: {
      actual,
      expected,
      comparison
    }
  });
};

const extractAssertionErrorData = (e: AssertionError): BasicErrorData => {
  const actual = stringify(e.actual);
  const expected = stringify(e.expected);
  const message = `Assertion error: ${e.message ?? ''}`;
  if (e.showDiff !== false) {
    return {
      type: e.name,
      message,
      diff: {
        expected,
        actual,
        comparison: Differ.diffPrettyText(actual, expected)
      }
    };
  } else {
    return { type: e.name, message };
  }
};

export const getBasicErrorData = (e: TestError): BasicErrorData => {
  if (TestError.isHTMLDiffError(e) || TestError.isPprintAssertionError(e)) {
    return extractErrorData(e);
  } else if (TestError.isAssertionError(e)) {
    return extractAssertionErrorData(e);
  } else if (e.name && e.message) {
    return { type: 'Error', message: e.name + ': ' + e.message };
  } else if (e.toString !== undefined) {
    return { type: 'Error', message: String(e) };
  } else {
    return { type: 'Error', message: JSON.stringify(e) };
  }
};

export const getErrorData = (err: LoggedError): ErrorData => {
  const e = extractError(err);
  const formattedLogs = err.logs && err.logs.length > 0 ? err.logs.map((log) => log
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
  ).join('\n') : undefined;
  return {
    ...getBasicErrorData(e),
    stack: extractStack(e),
    logs: formattedLogs
  };
};
