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

export type TestError = JsError | AssertionError | PprintAssertionError | HtmlDiffAssertionError;

export const pprintAssertionError = (message: string, actual: string, expected: string): PprintAssertionError => {
  const e: Partial<PprintAssertionError> = new Error(message);
  e.name = 'PprintAssertionError';
  e.diff = {
    actual,
    expected
  };
  return e as PprintAssertionError;
};

export const isPprintAssertionError = (err: TestError): err is PprintAssertionError =>
  err.name === 'PprintAssertionError';

export const isHTMLDiffError = (err: TestError): err is HtmlDiffAssertionError =>
  err.name === 'HtmlAssertion';

export const isAssertionError = (err: TestError): err is AssertionError =>
  err.name === 'AssertionError';
