import { assert } from 'chai';
import * as fc from 'fast-check';
import { describe, it } from 'mocha';
import { formatElapsedTime } from '../../main/ts/core/Utils';

describe("Utils.formatElapsedTime", () => {
  it("should be larger than 0", () => {
    const now = new Date();
    const fiveSeconds = new Date(now.getTime() + 5000);
    fc.assert(fc.property(fc.date({ max: now }), fc.date({ min: fiveSeconds }), (start, end) => {
      const result = parseFloat(formatElapsedTime(start, end));
      assert.isAtLeast(result, 5.0);
    }));
  });

  it("should be 0 if same dates", () => {
    const now = new Date();
    const result = formatElapsedTime(now, now);
    assert.equal(parseFloat(result), 0.0);
    assert.equal(result, '0.000s');
  })
});
