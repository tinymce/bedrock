import * as TestError from './TestError';
import * as LoggedError from './LoggedError';
import * as Differ from './Differ';
import { htmlentities } from './StringUtils';

type LoggedError = LoggedError.LoggedError;

type TestError = TestError.TestError;
type PprintAssertionError = TestError.PprintAssertionError;

/* Required to make <del> and <ins> stay as tags.*/
const processQUnit = (html: string): string =>
  (html
    .replace(/&lt;del&gt;/g, '<del>')
    .replace(/&lt;\/del&gt;/g, '</del>')
    .replace(/&lt;ins&gt;/g, '<ins>')
    .replace(/&lt;\/ins&gt;/g, '</ins>'));

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

const extractError = (err: LoggedError): TestError =>
  err === undefined ? new Error('no error given') : err.error;

const mkHtml = (e: TestError): string => {
  if (TestError.isHTMLDiffError(e)) {
    // Provide detailed HTML comparison information
    return 'Test failure: ' + e.message +
        '\nExpected: ' + htmlentities(e.diff.expected) +
        '\nActual: ' + htmlentities(e.diff.actual) +
        '\n\nHTML Diff: ' + processQUnit(htmlentities(e.diff.comparison));
  } else if (TestError.isPprintAssertionError(e)) {
    const dh = Differ.diffPrettyHtml(e.diff.actual, e.diff.expected);
    return 'Test failure: ' + e.message +
        '\nExpected: \n' + htmlentities(e.diff.expected) +
        '\nActual: \n' + htmlentities(e.diff.actual) +
        '\nDiff: \n' + dh;
  } else if (TestError.isAssertionError(e)) {
    // TODO: make this look more like the PprintAssertionError
    return 'Assertion error' + (e.message ? ' [' + e.message + ']' : '') +
        ': [' + htmlentities(JSON.stringify(e.expected)) + '] ' + e.operator +
        ' [' + htmlentities(JSON.stringify(e.actual)) + ']';
  } else if (e.name && e.message) {
    return htmlentities(e.name + ': ' + e.message);
  } else if (e.toString !== undefined) {
    return htmlentities(String(e));
  } else {
    return htmlentities(JSON.stringify(e));
  }
};

export const pprintAssertionText = (e: PprintAssertionError): string => {
  const dh = Differ.diffPrettyText(e.diff.actual, e.diff.expected);
  return 'Test failure: ' + e.message +
      '\nExpected: \n' + e.diff.expected +
      '\nActual: \n' + e.diff.actual +
      '\nDiff: \n' + dh;
};

const mkText = (e: TestError): string => {
  if (TestError.isHTMLDiffError(e)) {
    // Provide detailed HTML comparison information
    return 'Test failure: ' + e.message +
        '\nExpected: ' + (e.diff.expected) +
        '\nActual: ' + (e.diff.actual) +
        '\n\nHTML Diff: ' + (e.diff.comparison);
  } else if (TestError.isPprintAssertionError(e)) {
    return pprintAssertionText(e)
  } else if (TestError.isAssertionError(e)) {
    // TODO: make this look more like the PprintAssertionError
    return 'Assertion error' + (e.message ? ' [' + e.message + ']' : '') +
        ': [' + (JSON.stringify(e.expected)) + '] ' + e.operator +
        ' [' + (JSON.stringify(e.actual)) + ']';
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
  return mkHtml(e) + formatExtra(err);
};

export const text = (err: LoggedError): string => {
  const e = extractError(err);
  return mkText(e) + formatExtra(err);
};
