import Compare from '../core/Compare';

var eq = function<A=any> (expected: A, actual: A, message?: string) {
  var result = Compare.compare(expected, actual);
  if (!result.eq) {
    if (message !== undefined)
      throw new Error(message);
    else
      throw new Error(result.why);
  }
};

var throws = function (f: () => void, expected?: string, message?: string) {
  var token = {};

  try {
    f();
    throw token;
  } catch (e) {
    if (e === token)
      throw new Error(message);
    if (expected !== undefined)
      eq(expected, e, message);
  }
};

var throwsError = function (f: () => void, expected?: string, message?: string) {
  var token = {};

  try {
    f();
    throw token;
  } catch (e) {
    if (e === token)
      throw new Error(message);
    if (expected !== undefined)
      eq(expected, e.message, message);
  }
}

var succeeds = function (f: () => void, message: string) {
  try {
    f();
  } catch (e) {
    throw new Error(message);
  }
};

var fail = function (message?: string) {
  if (message !== undefined)
    throw new Error(message);
  else
    throw new Error('Test failed.');
};

var html = function (expected: string, actual: string, message: string) {
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