import { assert } from 'chai';
import { describe, it } from 'mocha';
import * as Reporter from '../../../main/ts/api/Reporter';
import * as NodeAssert from 'assert';
import * as LoggedError from "../../../main/ts/api/LoggedError";

describe("Reporter", () => {
  it('Reports Node Assertions as text', () => {
    try {
      NodeAssert.strictEqual(3, 4, 'blah');
    } catch (e) {
      const actual = Reporter.text(LoggedError.loggedError(e, []));
      const expected = 'Assertion error [blah]: [4] strictEqual [3]\n\nLogs:\n';
      assert.deepEqual(actual, expected, 'text output');
    }
  });

  it('Reports Node Assertions as html', () => {
    try {
      NodeAssert.strictEqual('<span>', '<div>', 'blah');
    } catch (e) {
      const actual = Reporter.html(LoggedError.loggedError(e, []));
      const expected = 'Assertion error [blah]: [&quot;&lt;div&gt;&quot;] strictEqual [&quot;&lt;span&gt;&quot;]\n\nLogs:\n';
      assert.deepEqual(actual, expected, 'text output');
    }
  });
});
