import * as fc from 'fast-check';
import { describe, it } from 'mocha';
import { TestLabel } from '../../../main/ts/api/TestLabel';

describe('TestLabel.asString', () => {
  it('stringifies strings', () => {
    fc.assert(fc.property(fc.string(), (s) => TestLabel.asString(s) === s));
  });

  it('stringifies () => strings', () => {
    fc.assert(fc.property(fc.string(), (s) => TestLabel.asString(() => s) === s));
  });
});

describe('TestLabel.asStringOr', () => {
  it('stringifies strings', () => {
    fc.assert(fc.property(fc.string(), fc.string(), (a, b) => TestLabel.asStringOr(a, b) === a));
  });

  it('defaults for null', () => {
    fc.assert(fc.property(fc.string(), (a) => TestLabel.asStringOr(null, a) === a));
  });

  it('defaults for undefined', () => {
    fc.assert(fc.property(fc.string(), (a) => TestLabel.asStringOr(undefined, a) === a));
  });
});
