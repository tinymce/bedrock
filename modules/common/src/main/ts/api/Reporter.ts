import * as TestError from './TestError';
import * as LoggedError from './LoggedError';
import * as Differ from './Differ';
import { htmlentities } from './StringUtils';

type LoggedError = LoggedError.LoggedError;

type TestError = TestError.TestError;
type PprintAssertionError = TestError.PprintAssertionError;
type HtmlDiffAssertionError = TestError.HtmlDiffAssertionError;
type AssertionError = TestError.AssertionError;

const identity = <T>(val: T): T => val;

const stringify = (e: any) => {
  if (e === undefined) {
    return 'undefined';
  } else if (typeof e === 'string') {
    return e;
  } else {
    return JSON.stringify(e);
  }
};

/* Required to make <del> and <ins> stay as tags.*/
const processQUnit = (html: string): string =>
  (html
    .replace(/&lt;del&gt;/g, '<del>')
    .replace(/&lt;\/del&gt;/g, '</del>')
    .replace(/&lt;ins&gt;/g, '<ins>')
    .replace(/&lt;\/ins&gt;/g, '</ins>'));

const extractError = (err?: LoggedError): TestError =>
  err === undefined ? new Error('no error given') : err;

const formatExtra = (e: LoggedError): string => {
  if (!e.logs || e.logs.length === 0) {
    if (e.stack) {
      const lines = e.stack.split('\n').filter((line) =>
        line.indexOf('at') !== -1);
      return '\n\nStack:\n' + lines.join('\n');
    } else {
      return '';
    }
  } else {
    const lines = e.logs.map((log) =>
      log.replace(/\n/g, '\\n').replace(/\r/g, '\\r'));
    return '\n\nLogs:\n' + lines.join('\n');
  }
};

const htmlDiffAssertionError = (e: HtmlDiffAssertionError, escape: (value: string) => string, process: (value: string) => string): string => {
  // TODO: make this look more like the PprintAssertionError
  return `Test failure: ${escape(e.message)}
Expected: ${escape(e.diff.expected)}
Actual: ${escape(e.diff.actual)}

HTML Diff: ${process(escape(e.diff.comparison))}`;
};

const htmlDiffAssertionErrorHtml = (e: HtmlDiffAssertionError): string => htmlDiffAssertionError(e, htmlentities, processQUnit);
// TODO: get rid of the <ins> and <del> in the text output. Probably need to change the code that throws this.
const htmlDiffAssertionErrorText = (e: HtmlDiffAssertionError): string => htmlDiffAssertionError(e, identity, identity);

const pprintAssertionError = (e: PprintAssertionError, escape: (value: string) => string, diff: (actual: string, expected: string) => string): string => {
  const dh = diff(e.diff.actual, e.diff.expected);
  return `Test failure: ${escape(e.message)}
Expected:
${escape(e.diff.expected)}
Actual:
${escape(e.diff.actual)}
Diff:
${dh}`;
};

export const pprintAssertionErrorHtml = (e: PprintAssertionError): string => pprintAssertionError(e, htmlentities, Differ.diffPrettyHtml);
export const pprintAssertionErrorText = (e: PprintAssertionError): string => pprintAssertionError(e, identity, Differ.diffPrettyText);

const assertionError = (e: AssertionError, escape: (value: string) => string, diff: (actual: string, expected: string) => string): string => {
  const actual = stringify(e.actual);
  const expected = stringify(e.expected);
  const message = `Assertion error: ${e.message ? escape(e.message) : ''}`;
  if (e.showDiff !== false) {
    const dh = diff(actual, expected);
    return `${message}
Expected:
${escape(expected)}
Actual:
${escape(actual)}
Diff:
${dh}`;
  } else {
    return message;
  }
};

const assertionErrorHtml = (e: AssertionError): string => assertionError(e, htmlentities, Differ.diffPrettyHtml);
const assertionErrorText = (e: AssertionError): string => assertionError(e, identity, Differ.diffPrettyText);

const mkHtml = (e: TestError): string => {
  if (TestError.isHTMLDiffError(e)) {
    return htmlDiffAssertionErrorHtml(e);
  } else if (TestError.isPprintAssertionError(e)) {
    return pprintAssertionErrorHtml(e);
  } else if (TestError.isAssertionError(e)) {
    return assertionErrorHtml(e);
  } else if (e.name && e.message) {
    return htmlentities(e.name + ': ' + e.message);
  } else if (e.toString !== undefined) {
    return htmlentities(String(e));
  } else {
    return htmlentities(JSON.stringify(e));
  }
};

const mkText = (e: TestError): string => {
  if (TestError.isHTMLDiffError(e)) {
    return htmlDiffAssertionErrorText(e);
  } else if (TestError.isPprintAssertionError(e)) {
    return pprintAssertionErrorText(e);
  } else if (TestError.isAssertionError(e)) {
    return assertionErrorText(e);
  } else if (e.name && e.message) {
    return (e.name + ': ' + e.message);
  } else if (e.toString !== undefined) {
    return String(e);
  } else {
    return JSON.stringify(e);
  }
};

export const html = (err: LoggedError): string => {
  const e = extractError(err);
  return mkHtml(e) + htmlentities(formatExtra(err));
};

export const text = (err: LoggedError): string => {
  const e = extractError(err);
  return mkText(e) + formatExtra(err);
};
