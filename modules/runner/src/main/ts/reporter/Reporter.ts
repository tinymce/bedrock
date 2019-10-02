import {
  AssertionError,
  HtmlDiffAssertionError,
  LoggedError,
  NormalizedTestError,
  PprintAssertionError
} from '../alien/ErrorTypes';
import * as Differ from '../core/Differ';


const htmlentities = (str: string): string =>
  String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Required to make <del> and <ins> stay as tags.*/
const processQUnit = (html: string): string =>
  (html
    .replace(/&lt;del&gt;/g, '<del>')
    .replace(/&lt;\/del&gt;/g, '</del>')
    .replace(/&lt;ins&gt;/g, '<ins>')
    .replace(/&lt;\/ins&gt;/g, '</ins>'));

const isPprintAssertionError = (err: NormalizedTestError): err is PprintAssertionError => {
  return err.name === 'PprintAssertionError';
};

const isHTMLDiffError = (err: NormalizedTestError): err is HtmlDiffAssertionError => {
  return err.name === 'HtmlAssertion';
};

const isAssertionError = (err: NormalizedTestError): err is AssertionError => {
  return err.name === 'AssertionError';
};

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

export const html = (err: LoggedError): string => {
  const e = err === undefined ? new Error('no error given') : err.error;

  const extra = formatExtra(err);
  if (isHTMLDiffError(e)) {
    // Provide detailed HTML comparison information
    return 'Test failure: ' + e.message +
      '\nExpected: ' + htmlentities(e.diff.expected) +
      '\nActual: ' + htmlentities(e.diff.actual) +
      '\n\nHTML Diff: ' + processQUnit(htmlentities(e.diff.comparison)) +
      extra;
  } else if (isPprintAssertionError(e)) {
    const d = Differ.diffLineMode(e.diff.expected, e.diff.actual);
    const dh = Differ.diffPrettyHtml(d);
    return 'Test failure: ' + e.message +
      '\nExpected: \n' + htmlentities(e.diff.expected) +
      '\nActual: \n' + htmlentities(e.diff.actual) +
      '\nDiff: \n' + dh;
  } else if (isAssertionError(e)) {
    return 'Assertion error' + (e.message ? ' [' + e.message + ']' : '') +
      ': [' + htmlentities(JSON.stringify(e.expected)) + '] ' + e.operator +
      ' [' + htmlentities(JSON.stringify(e.actual)) + ']' + extra;
  } else if (e.name && e.message) {
    return htmlentities(e.name + ': ' + e.message + extra);
  } else if (e.toString !== undefined) {
    return htmlentities(String(e) + extra);
  } else {
    return htmlentities(JSON.stringify(e) + extra);
  }
};
