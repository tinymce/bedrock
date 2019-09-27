import * as fc from 'fast-check';
import { assert } from 'chai';
import { UrlParams } from '../../main/ts/core/UrlParams';
import { describe, it } from 'mocha';

describe("UrlParams.nat", () => {
  it("parses undefined as 0", () => {
    assert.equal(UrlParams.nat(undefined), 0);
  });

  it("parses a nat as a nat", () => {
    fc.assert(fc.property(fc.nat(), (n) => UrlParams.nat(String(n)) === n));
  });

  it("parses a neg as 0", () => {
    fc.assert(fc.property(fc.nat(), (n) => UrlParams.nat(String(-n)) === 0));
  });

  it("parses a non-number as 0", () => {
    assert.equal(UrlParams.nat(''), 0);
    assert.equal(UrlParams.nat('cat'), 0);
    assert.equal(UrlParams.nat('[]'), 0);
    assert.equal(UrlParams.nat('frog'), 0);
  });
});
