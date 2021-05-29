import * as TestError from './TestError';
import * as ErrorExtractor from './ErrorExtractor';
import * as LoggedError from './LoggedError';
import * as Differ from './Differ';
import { htmlentities } from './StringUtils';

type LoggedError = LoggedError.LoggedError;

type PprintAssertionError = TestError.PprintAssertionError;
type BasicErrorData = ErrorExtractor.BasicErrorData;
type ErrorData = ErrorExtractor.ErrorData;

type DifferFn = (actual: string, expected: string, comparison?: string) => string;

const identity = <T>(val: T): T => val;

/* Required to make <del> and <ins> stay as tags.*/
const processQUnit = (html: string): string =>
  (html
    .replace(/&lt;del&gt;/g, '<del>')
    .replace(/&lt;\/del&gt;/g, '</del>')
    .replace(/&lt;ins&gt;/g, '<ins>')
    .replace(/&lt;\/ins&gt;/g, '</ins>'));

const pprintExtra = (e: ErrorData): string => {
  if (e.logs !== undefined && e.logs.length > 0) {
    return `\n\nLogs:\n${e.logs}`;
  } else if (e.stack !== undefined && e.stack.length > 0) {
    return `\n\nStack:\n${e.stack}`;
  } else {
    return '';
  }
};

const pprintDiff = (e: BasicErrorData, escape: (value: string) => string, diff: DifferFn) => {
  if (e.diff) {
    const comparison = e.type === 'HtmlAssertion' ? escape(e.diff.comparison) : undefined;
    const dh = diff(e.diff.actual, e.diff.expected, comparison);
    return `Expected:
${escape(e.diff.expected)}
Actual:
${escape(e.diff.actual)}
Diff:
${dh}`;
  } else {
    return '';
  }
};

const pprintBasicError = (e: BasicErrorData, escape: (value: string) => string, diff: DifferFn): string => {
  const message = escape(e.message);
  const diffMessage = pprintDiff(e, escape, diff);
  if (diffMessage.length > 0) {
    return `${message}\n${diffMessage}`;
  } else {
    return message;
  }
};

const pprintError = (e: ErrorData, escape: (value: string) => string, diff: DifferFn): string => {
  const message = pprintBasicError(e, escape, diff);
  const extras = escape(pprintExtra(e));
  return `${message}${extras}`;
};

export const pprintAssertionError = (e: PprintAssertionError): string => {
  const err = ErrorExtractor.getBasicErrorData(e);
  return pprintBasicError(err, identity, Differ.diffPrettyText);
};

export const data = (err: LoggedError): ErrorData =>
  ErrorExtractor.getErrorData(err);

export const dataHtml = (err: ErrorData): string =>
  pprintError(err, htmlentities, (actual, expected, comparison) => {
    return comparison !== undefined ? processQUnit(comparison) : Differ.diffPrettyHtml(actual, expected);
  });

export const dataText = (err: ErrorData): string =>
  pprintError(err, identity, (actual, expected, comparison) => {
    // TODO: get rid of the <ins> and <del> in the comparison. Probably need to change the code that throws HtmlAssertionError.
    return comparison !== undefined ? comparison : Differ.diffPrettyText(actual, expected);
  });

export const html = (err: LoggedError): string => {
  const e = ErrorExtractor.getErrorData(err);
  return dataHtml(e);
};

export const text = (err: LoggedError): string => {
  const e = ErrorExtractor.getErrorData(err);
  return dataText(e);
};