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

module.exports = {
  failed: failed,
  passed: passed,
  cata: cata
};