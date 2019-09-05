// NOTE: Duplicated with the client, so make sure to make any changes in both locations

interface JsError extends Error {
  toString?: () => string;
}

export interface AssertionError extends JsError {
  expected: string;
  actual: string;
  operator: string;
}

export interface HtmlDiffAssertionError extends JsError {
  diff: {
    expected: string;
    actual: string;
    comparison: string;
  };
  label: string;
  stack: string;
}

export type NormalizedTestError = JsError | AssertionError | HtmlDiffAssertionError;

export interface LoggedError {
  error: NormalizedTestError;
  logs: string[];
}