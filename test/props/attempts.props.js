var attempt = require('../../src/js/bedrock/core/attempt');
var tape = require('tape');

var jsc = require('jsverify');

(function () { return this; })().it = function (name, f) {
  tape(name, function (t) {
    f();
    t.end();
  });
};

var attemptPassedSpec = jsc.bless({
  generator: function () {
    return attempt.passed(
      jsc.json.generator(1)
    );
  },
  show: attempt.toString
});

var attemptFailedSpec = jsc.bless({
  generator: function () {
    return attempt.failed(
      jsc.array(
        jsc.number,
        jsc.string
      ).generator(1)
    );
  },
  show: attempt.toString
});

var attemptSpec = jsc.bless({
  generator: function () {
    var b = jsc.bool.generator();
    return b === true ? attemptPassedSpec.generator() : attemptFailedSpec.generator();
  },
  show: attempt.toString
});

var propFailed = jsc.property("failed attempt -> hasPassed === false", attemptFailedSpec, function (arr) {
  return attempt.hasPassed(arr) === false;
});

var propSucceeded = jsc.property("successful attempt -> hasPassed === true", attemptPassedSpec, function (arr) {
  return attempt.hasPassed(arr) === true;
});

var concat1 = jsc.property('attempt.concat should pass if all true', jsc.array(attemptPassedSpec), function (attempts) {
  var result = attempt.concat(attempts);
  return attempt.hasPassed(result);
});

var concat2 = jsc.property('attempt.concat should fail if any have failed', jsc.array(attemptSpec), function (attempts) {
  var result = attempt.concat(attempts);
  var allPassed = attempts.filter(attempt.hasPassed).length === attempts.length;
  return attempt.hasPassed(result) === allPassed;
});

var concat3 = jsc.property('attempt.concat should concatenate any error messages', jsc.array(attemptSpec), function (attempts) {
  var result = attempt.concat(attempts);
  var failed = attempts.filter(function (at) { return !attempt.hasPassed(at); });
  var failedErrors = failed.reduce(function (rest, f) {
    var current = attempt.cata(f, function (x) {
      return x;
    }, function () {
      return [ ];
    });
    return rest.concat(current);
  }, []);

  return attempt.cata(result, function (errs) {
    return jsc.utils.isEqual(errs, failedErrors);
  }, function (v) {
    return jsc.utils.isEqual([ ], failed);
  });
});