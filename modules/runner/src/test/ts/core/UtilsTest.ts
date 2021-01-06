import { Suite, Test } from '@ephox/bedrock-common';
import { assert } from 'chai';
import * as fc from 'fast-check';
import { beforeEach, describe, it } from 'mocha';
import { createSuite, createRootSuite } from '../../../main/ts/core/Suite';
import { createTest } from '../../../main/ts/core/Test';
import * as Utils from '../../../main/ts/core/Utils';
import { noop } from '../TestUtils';

describe('Utils.makeQueryParams', () => {
  it('should be empty if offset and retry is 0', () => {
    const str = Utils.makeQueryParams('1', 0, 1, 0, 0);
    assert.equal(str, '');
  });

  it('should always include a session, offset and failed params if offset > 0', () => {
    fc.assert(fc.property(fc.hexaString(), fc.integer(1, 1000), fc.nat(), (session, offset, failed) => {
      assert.equal(Utils.makeQueryParams(session, offset, failed, 0, 0), '?session=' + session + '&offset=' + offset + '&failed=' + failed);
    }));
  });

  it('should always include a session, offset and failed params if retries > 0', () => {
    fc.assert(fc.property(fc.hexaString(), fc.integer(1, 1000), fc.nat(), (session, retries, failed) => {
      assert.equal(Utils.makeQueryParams(session, 0, failed, 0, retries), '?session=' + session + '&offset=' + 0 + '&failed=' + failed + '&retry=' + retries);
    }));
  });

  it('should exclude retries if 0', () => {
    const str = Utils.makeQueryParams('1', 1, 0, 0, 0);
    assert.equal(str, '?session=1&offset=1&failed=0');
  });

  it('should include retries if > 0', () => {
    const str = Utils.makeQueryParams('1', 1, 1, 0, 1);
    assert.equal(str, '?session=1&offset=1&failed=1&retry=1');
  });

  it('should include skipped if > 0', () => {
    const str = Utils.makeQueryParams('1', 1, 1, 1, 0);
    assert.equal(str, '?session=1&offset=1&failed=1&skipped=1');
  });
});

describe('Utils.formatElapsedTime', () => {
  it('should be larger than 0', () => {
    const now = new Date();
    const fiveSeconds = new Date(now.getTime() + 5000);
    fc.assert(fc.property(fc.date({ max: now }), fc.date({ min: fiveSeconds }), (start, end) => {
      const result = parseFloat(Utils.formatElapsedTime(start, end));
      assert.isAtLeast(result, 5.0);
    }));
  });

  it('should be 0 if same dates', () => {
    const now = new Date();
    const result = Utils.formatElapsedTime(now, now);
    assert.equal(parseFloat(result), 0.0);
    assert.equal(result, '0.000s');
  });
});

describe('Utils.getFullTitle', () => {
  let suite: Suite;
  let test: Test;

  beforeEach(() => {
    suite = createRootSuite('root');
    test = createTest('test', noop);
  });

  it('should be just the title when there is no parent', () => {
    assert.equal(Utils.getFullTitle(suite, '/'), 'root');
    assert.equal(Utils.getFullTitle(test, '-'), 'test');
  });

  it('should be include the suite and test name', () => {
    const testWithParent = createTest('test', noop, suite);
    assert.equal(Utils.getFullTitle(testWithParent, '-'), 'root - test');

    const nestedSuite = createSuite('nested', suite);
    const nestedTest = createSuite('test', nestedSuite);
    assert.equal(Utils.getFullTitle(nestedTest, '-'), 'root / nested - test');
  });
});
