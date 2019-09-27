import * as Compare from '../core/Compare';
import { TestLabel } from './TestLabel';

const eq = function (expected: any, actual: any, message?: TestLabel) {
  const result = Compare.compare(expected, actual);
  if (!result.eq) {
    throw new Error(TestLabel.asStringOr(message, result.why));
  }
};

const throws = function (f: () => void, expected?: string, message?: TestLabel) {
  const token = {};

  try {
    f();
    // noinspection ExceptionCaughtLocallyJS
    throw token;
  } catch (e) {
    if (e === token) {
      throw new Error(TestLabel.asStringOr(message, () => 'Expected function to throw, but it didn\'t.'));
    }
    if (expected !== undefined) {
      eq(expected, e, message);
    }
  }
};

const throwsError = function (f: () => void, expected?: string, message?: TestLabel) {
  const token = {};

  try {
    f();
    // noinspection ExceptionCaughtLocallyJS
    throw token;
  } catch (e) {
    if (e === token) {
      throw new Error(TestLabel.asStringOr(message, () => 'Expected function to throw, but it didn\'t.'));
    }
    if (expected !== undefined) {
      eq(expected, e.message, message);
    }
  }
};

const succeeds = function (f: () => void, message?: TestLabel) {
  try {
    f();
  } catch (e) {
    throw new Error(TestLabel.asStringOr(message, () => 'Expected function to not throw, but it did.'));
  }
};

const fail = function (message?: TestLabel) {
  throw new Error(TestLabel.asStringOr(message, () => 'Test failed'));
};

export {
  eq,
  throws,
  throwsError,
  succeeds,
  fail
};
