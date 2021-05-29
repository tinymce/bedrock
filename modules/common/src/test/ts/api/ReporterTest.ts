import { assert } from 'chai';
import { describe, it } from 'mocha';
import * as LoggedError from '../../../main/ts/api/LoggedError';
import * as Reporter from '../../../main/ts/api/Reporter';
import { AssertionError, HtmlDiffAssertionError } from '../../../main/ts/api/TestError';

const htmlAssertion = (): HtmlDiffAssertionError => {
  const e: any = new Error('message"');
  e.diff = {
    expected: 'abc"hello"',
    actual: 'ab"hello"',
    comparison: '<ins>blah</ins><del>hello</del>"hello"<span>'
  };
  e.label = '"label"1';
  e.name = 'HtmlAssertion';
  return e;
};

const assertion = (): AssertionError => {
  const e: any = new Error('message"');
  e.expected = 'abc"hello"';
  e.actual = 'ab"hello"';
  e.showDiff = true;
  e.label = '"label"1';
  e.name = 'AssertionError';
  return e;
};

const cleanStack = (message: string): string =>
  message.replace(/Stack:(\n|.)*/, 'Stack:\n');

describe('Reporter', () => {
  it('Reports thrown js errors as html', () => {
    try {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error('blarg<span>');
    } catch (e) {
      const actual = Reporter.html(LoggedError.loggedError(e, [ '  * Log Message' ]));
      const expected = 'Error: blarg&lt;span&gt;\n\nLogs:\n  * Log Message';
      assert.deepEqual(actual, expected, 'Error message');
    }
  });

  it('Reports thrown js errors with html in logs as html', () => {
    try {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error('blarg<span>');
    } catch (e) {
      const actual = Reporter.html(LoggedError.loggedError(e, [
        'PprintAssertionError: Checking attribute: "height" of <iframe src="http://www.example.com/" width="200" height="200"></iframe>'
      ]));
      const expected = 'Error: blarg&lt;span&gt;\n\nLogs:\n' +
        'PprintAssertionError: Checking attribute: &quot;height&quot; of &lt;iframe src=&quot;http://www.example.com/&quot; width=&quot;200&quot; height=&quot;200&quot;&gt;&lt;/iframe&gt;';
      assert.deepEqual(actual, expected, 'Error message');
    }
  });

  it('Reports thrown js errors as text', () => {
    try {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error('blarg<span>');
    } catch (e) {
      const actual = Reporter.text(LoggedError.loggedError(e, [ '  * Log Message' ]));
      const expected = 'Error: blarg<span>\n\nLogs:\n  * Log Message';
      assert.deepEqual(actual, expected, 'Error message');
    }
  });

  it('Reports thrown HtmlDiffAssertionError errors as html', () => {
    try {
      // noinspection ExceptionCaughtLocallyJS
      throw htmlAssertion();
    } catch (e) {
      const actual = Reporter.html(LoggedError.loggedError(e, []));
      // NOTE: the <ins> and <del> are supposed to remain
      const expected =
        'Test failure: message&quot;\n' +
        'Expected:\n' +
        'abc&quot;hello&quot;\n' +
        'Actual:\n' +
        'ab&quot;hello&quot;\n' +
        'Diff:\n' +
        '<ins>blah</ins><del>hello</del>&quot;hello&quot;&lt;span&gt;\n' +
        '\n' +
        'Stack:\n';
      assert.deepEqual(cleanStack(actual), expected, 'Error message');
    }
  });

  it('Reports thrown HtmlDiffAssertionError errors as text', () => {
    try {
      // noinspection ExceptionCaughtLocallyJS
      throw htmlAssertion();
    } catch (e) {
      const actual = Reporter.text(LoggedError.loggedError(e, []));
      const expected =
        'Test failure: message"\n' +
        'Expected:\n' +
        'abc"hello"\n' +
        'Actual:\n' +
        'ab"hello"\n' +
        'Diff:\n' +
        '<ins>blah</ins><del>hello</del>"hello"<span>\n' +
        '\n' +
        'Stack:\n';
      assert.deepEqual(cleanStack(actual), expected, 'Error message');
    }
  });

  it('Reports thrown AssertionError errors as html', () => {
    try {
      // noinspection ExceptionCaughtLocallyJS
      throw assertion();
    } catch (e) {
      const actual = Reporter.html(LoggedError.loggedError(e, []));
      const expected =
        'Assertion error: message&quot;\n' +
        'Expected:\n' +
        'abc&quot;hello&quot;\n' +
        'Actual:\n' +
        'ab&quot;hello&quot;\n' +
        'Diff:\n' +
        '<del style="background:#ffe6e6;">ab&quot;hello&quot;</del><br /><ins style="background:#e6ffe6;">abc&quot;hello&quot;</ins><br />\n' +
        '\n' +
        'Stack:\n';
      assert.deepEqual(cleanStack(actual), expected, 'Error message');
    }
  });

  it('Reports thrown AssertionError errors as text', () => {
    try {
      // noinspection ExceptionCaughtLocallyJS
      throw assertion();
    } catch (e) {
      const actual = Reporter.text(LoggedError.loggedError(e, []));
      const expected =
        'Assertion error: message"\n' +
        'Expected:\n' +
        'abc"hello"\n' +
        'Actual:\n' +
        'ab"hello"\n' +
        'Diff:\n' +
        '- | ab"hello"\n' +
        '+ | abc"hello"\n' +
        '\n' +
        'Stack:\n';
      assert.deepEqual(cleanStack(actual), expected, 'Error message');
    }
  });
});
