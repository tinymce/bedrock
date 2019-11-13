import { assert } from 'chai';
import { describe, it } from 'mocha';
import * as Reporter from '../../../main/ts/api/Reporter';
import * as LoggedError from '../../../main/ts/api/LoggedError';

function htmlAssertion() {
  const e: any = new Error('message"');
  e.diff = {
    expected: 'abc"hello"',
    actual: 'ab"hello"',
    comparison: '<ins>blah</ins><del>hello</del>"hello"<span>'
  };
  e.label = '"label"1';
  e.name = 'HtmlAssertion';
  return e;
}

describe("Reporter", () => {
  it('Reports thrown js errors as html', () => {
    try {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error('blarg<span>');
    } catch (e) {
      const actual = Reporter.html(LoggedError.loggedError(e, []));
      const expected = 'Error: blarg&lt;span&gt;\n\nLogs:\n';
      assert.deepEqual(actual, expected, 'Error message')
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
      assert.deepEqual(actual, expected, 'Error message')
    }
  });

  it('Reports thrown js errors as text', () => {
    try {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error('blarg<span>');
    } catch (e) {
      const actual = Reporter.text(LoggedError.loggedError(e, []));
      const expected = 'Error: blarg<span>\n\nLogs:\n';
      assert.deepEqual(actual, expected, 'Error message')
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
        'Test failure: message"\n' +
        'Expected: abc&quot;hello&quot;\n' +
        'Actual: ab&quot;hello&quot;\n' +
        '\n' +
        'HTML Diff: <ins>blah</ins><del>hello</del>&quot;hello&quot;&lt;span&gt;\n' +
        '\n' +
        'Logs:\n';
      assert.deepEqual(actual, expected, 'Error message')
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
        'Expected: abc"hello"\n' +
        'Actual: ab"hello"\n' +
        '\n' +
        'HTML Diff: <ins>blah</ins><del>hello</del>"hello"<span>\n' +
        '\n' +
        'Logs:\n';
      assert.deepEqual(actual, expected, 'Error message')
    }
  });

});
