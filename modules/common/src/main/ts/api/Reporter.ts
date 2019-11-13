import * as TestError from './TestError';
import * as LoggedError from './LoggedError';
import * as Differ from './Differ';
import { htmlentities } from './StringUtils';

type LoggedError = LoggedError.LoggedError;

type TestError = TestError.TestError;
type PprintAssertionError = TestError.PprintAssertionError;
type HtmlDiffAssertionError = TestError.HtmlDiffAssertionError;
type AssertionError = TestError.AssertionError;

/* Required to make <del> and <ins> stay as tags.*/
const processQUnit = (html: string): string =>
  (html
    .replace(/&lt;del&gt;/g, '<del>')
    .replace(/&lt;\/del&gt;/g, '</del>')
    .replace(/&lt;ins&gt;/g, '<ins>')
    .replace(/&lt;\/ins&gt;/g, '</ins>'));

const extractError = (err: LoggedError): TestError =>
  err === undefined ? new Error('no error given') : err.error;

const formatExtra = (e: LoggedError): string => {
  if (!e.logs) {
    if (e.error && e.error.stack) {
      const lines = e.error.stack.split('\n').filter((line) =>
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

const htmlDiffAssertionErrorHtml = (e: HtmlDiffAssertionError): string => {
  return `Test failure: ${e.message}
Expected: ${htmlentities(e.diff.expected)}
Actual: ${htmlentities(e.diff.actual)}

HTML Diff: ${processQUnit(htmlentities(e.diff.comparison))}`;
};

const htmlDiffAssertionErrorText = (e: HtmlDiffAssertionError): string => {
  // TODO: make this look more like the PprintAssertionError
  // TODO: get rid of the <ins> and <del> in the text output. Probably need to change the code that throws this.
  return `Test failure: ${e.message}
Expected: ${e.diff.expected}
Actual: ${e.diff.actual}

HTML Diff: ${e.diff.comparison}`;
};

const pprintAssertionErrorHtml = (e: PprintAssertionError): string => {
  const dh = Differ.diffPrettyHtml(e.diff.actual, e.diff.expected);
  return `Test failure: ${e.message}
Expected: 
${htmlentities(e.diff.expected)}
Actual: 
${htmlentities(e.diff.actual)}
Diff: 
${dh}`;
};

export const pprintAssertionText = (e: PprintAssertionError): string => {
  const dh = Differ.diffPrettyText(e.diff.actual, e.diff.expected);
  return `Test failure: ${e.message}
Expected: 
${e.diff.expected}
Actual: 
${e.diff.actual}
Diff: 
${dh}`;
};

const assertionErrorHtml = (e: AssertionError) => {
// TODO: make this look more like the PprintAssertionError
  return 'Assertion error' + (e.message ? ' [' + e.message + ']' : '') +
    ': [' + htmlentities(JSON.stringify(e.expected)) + '] ' + e.operator +
    ' [' + htmlentities(JSON.stringify(e.actual)) + ']';
};

const assertionErrorText = (e: AssertionError): string => {
// TODO: make this look more like the PprintAssertionError
  return 'Assertion error' + (e.message ? ' [' + e.message + ']' : '') +
    ': [' + (JSON.stringify(e.expected)) + '] ' + e.operator +
    ' [' + (JSON.stringify(e.actual)) + ']';
};

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
    return pprintAssertionText(e)
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
