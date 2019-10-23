export interface JsError extends Error {
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
}

export interface PprintAssertionError extends JsError {
  diff: {
    expected: string;
    actual: string;
  };
}

export type NormalizedTestError = JsError | AssertionError | PprintAssertionError | HtmlDiffAssertionError;

export interface LoggedError {
  error: NormalizedTestError;
  logs: string[];
}

export const pprintAssertionError = (message: string, actual: string, expected: string): PprintAssertionError => {
  const e: Partial<PprintAssertionError> = new Error(message);
  e.name = 'PprintAssertionError';
  e.diff = {
    actual,
    expected
  };
  return e as PprintAssertionError;
};

export const isPprintAssertionError = (err: NormalizedTestError): err is PprintAssertionError =>
  err.name === 'PprintAssertionError';

export const isHTMLDiffError = (err: NormalizedTestError): err is HtmlDiffAssertionError =>
  err.name === 'HtmlAssertion';

export const isAssertionError = (err: NormalizedTestError): err is AssertionError =>
  err.name === 'AssertionError';
