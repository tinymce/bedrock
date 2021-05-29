import { TestLabel } from '@ephox/bedrock-common';
import * as Compare from '../core/Compare';

/** @deprecated Use chai assertions or the Assert module instead */
const eq = function (expected: any, actual: any, message?: TestLabel): void {
  const result = Compare.compare(expected, actual);
  if (!result.eq) {
    const error: any = new Error(TestLabel.asStringOr(message, result.message));
    error.name = 'AssertionError';
    error.actual = actual;
    error.expected = expected;
    throw error;
  }
};

/** @deprecated Use chai assertions or the Assert module instead */
const throws = function (f: () => void, expected?: string, message?: TestLabel): void {
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

/** @deprecated Use chai assertions or the Assert module instead */
const throwsError = function (f: () => void, expected?: string, message?: TestLabel): void {
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

/** @deprecated Use chai assertions or the Assert module instead */
const succeeds = function (f: () => void, message?: TestLabel): void {
  try {
    f();
  } catch (e) {
    throw new Error(TestLabel.asStringOr(message, () => 'Expected function to not throw, but it did.'));
  }
};

/** @deprecated Use chai assertions or the Assert module instead */
const fail = function (message?: TestLabel): void {
  throw new Error(TestLabel.asStringOr(message, () => 'Test failed'));
};

export {
  eq,
  throws,
  throwsError,
  succeeds,
  fail
};
