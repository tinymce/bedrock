var failed = function (err) {
  var foldAttempt = function (onFailed, onPassed) {
    return onFailed(err);
  };

  return {
    foldAttempt: foldAttempt
  };
};

var passed = function (value) {
  var foldAttempt = function (onFailed, onPassed) {
    return onPassed(value);
  };

  return {
    foldAttempt: foldAttempt
  };
};

var cata = function (attempt, onFailed, onPassed) {
  return attempt.foldAttempt(onFailed, onPassed);
};

var bind = function (firstAttempt, f) {
  return firstAttempt.foldAttempt(function (err) {
    return failed(err);
  }, f);
};

var list = function (firstAttempt, fs) {
  return fs.reduce(function (rest, x) {
    return bind(rest, x);
  }, firstAttempt);
};

var carry = function (firstAttempt, secondAttempt, f) {
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

var concat = function (attempts) {
  // take a list of attempts, and turn them info an attempt of a list.
  return attempts.reduce(function (rest, b) {
    return carry(rest, b, function (x, y) {
      return passed(x.concat([ y ]));
    });
  }, passed([]));
};

module.exports = {
  failed: failed,
  passed: passed,
  cata: cata,
  bind: bind,
  list: list,
  carry: carry,
  concat: concat
};