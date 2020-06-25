import { assert } from 'chai';
import * as fc from 'fast-check';
import { describe, it } from 'mocha';
import * as Utils from '../../../main/ts/core/Utils';

describe('Utils.makeQueryParams', () => {
  it('should be empty if offset is 0', () => {
    const str = Utils.makeQueryParams('1', 0, 1, 0);
    assert.equal(str, '');
  });

  it('should always include a session, offset and failed params if offset > 0', () => {
    fc.assert(fc.property(fc.hexaString(), fc.integer(1, 1000), fc.nat(), (session, offset, failed) => {
      assert.equal(Utils.makeQueryParams(session, offset, failed, 0), '?session=' + session + '&offset=' + offset + '&failed=' + failed);
    }))
  });

  it('should exclude retries if 0', () => {
    const str = Utils.makeQueryParams('1', 1, 0, 0);
    assert.equal(str, '?session=1&offset=1&failed=0');
  });

  it('should include retries if > 0', () => {
    const str = Utils.makeQueryParams('1', 1, 1, 1);
    assert.equal(str, '?session=1&offset=1&failed=1&retry=1');
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
  })
});
