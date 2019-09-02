export const failed = function (err) {
  const foldAttempt = function (onFailed, onPassed) {
    return onFailed(err);
  };

  return {
    foldAttempt: foldAttempt
  };
};

export const passed = function (value) {
  const foldAttempt = function (onFailed, onPassed) {
    return onPassed(value);
  };

  return {
    foldAttempt: foldAttempt
  };
};

export const cata = function (attempt, onFailed, onPassed) {
  return attempt.foldAttempt(onFailed, onPassed);
};

export const bind = function (firstAttempt, f) {
  return firstAttempt.foldAttempt(function (err) {
    return failed(err);
  }, f);
};

export const map = function (firstAttempt, f) {
  return firstAttempt.foldAttempt(failed, function (v) {
    return passed(f(v));
  });
};

export const list = function (firstAttempt, fs) {
  return fs.reduce(function (rest, x) {
    return bind(rest, x);
  }, firstAttempt);
};

export const carry = function (firstAttempt, secondAttempt, f) {
  return cata(firstAttempt, function (errs) {
    return cata(secondAttempt, function (sErrs) {
      return failed(errs.concat(sErrs));
    }, function (_) {
      return failed(errs);
    });
  }, function (fValue) {
    return cata(secondAttempt, function (sErrs) {
      return failed(sErrs);
    }, function (sValue) {
      return f(fValue, sValue);
    });
  });
};

export const concat = function (attempts) {
  // take a list of attempts, and turn them info an attempt of a list.
  return attempts.reduce(function (rest, b) {
    return carry(rest, b, function (x, y) {
      return passed(x.concat([y]));
    });
  }, passed([]));
};

export const toString = function (attempt) {
  return cata(attempt, function (errs) {
    return 'attempt.failed(' + JSON.stringify(errs) + ')';
  }, function (value) {
    return 'attempt.passed(' + JSON.stringify(value) + ')';
  });
};

export const hasPassed = function (attempt) {
  return cata(attempt, function () {
    return false;
  }, function () {
    return true;
  });
};
