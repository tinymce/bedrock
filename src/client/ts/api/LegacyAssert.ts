import * as Compare from '../core/Compare';

const eq = function (expected: any, actual: any, message?: string) {
  const result = Compare.compare(expected, actual);
  if (!result.eq) {
    const prefix = message === undefined ? '' : (message + "\n");
    const e = prefix + result.why();
    throw new Error(e);
  }
};

const throws = function (f: () => void, expected?: string, message?: string) {
  const token = {};

  try {
    f();
    // noinspection ExceptionCaughtLocallyJS
    throw token;
  } catch (e) {
    if (e === token)
      throw new Error(message);
    if (expected !== undefined)
      eq(expected, e, message);
  }
};

const throwsError = function (f: () => void, expected?: string, message?: string) {
  const token = {};

  try {
    f();
    // noinspection ExceptionCaughtLocallyJS
    throw token;
  } catch (e) {
    if (e === token)
      throw new Error(message);
    if (expected !== undefined)
      eq(expected, e.message, message);
  }
};

const succeeds = function (f: () => void, message: string) {
  try {
    f();
  } catch (e) {
    throw new Error(message);
  }
};

const fail = function (message?: string) {
  if (message !== undefined)
    throw new Error(message);
  else
    throw new Error('Test failed.');
};

const html = function (expected: string, actual: string, message: string) {
  return {
    expected: expected,
    actual: actual,
    message: message
  };
};

export {
  eq,
  throws,
  throwsError,
  succeeds,
  fail,
  html
};