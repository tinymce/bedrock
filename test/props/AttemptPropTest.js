var Attempt = require('../../lib/server/main/ts/bedrock/core/Attempt').Attempt;
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
    return Attempt.passed(
      jsc.json.generator(1)
    );
  },
  show: Attempt.toString
});

var attemptFailedSpec = jsc.bless({
  generator: function () {
    return Attempt.failed(
      jsc.array(
        jsc.number,
        jsc.string
      ).generator(1)
    );
  },
  show: Attempt.toString
});

var attemptSpec = jsc.bless({
  generator: function () {
    var b = jsc.bool.generator();
    return b === true ? attemptPassedSpec.generator() : attemptFailedSpec.generator();
  },
  show: Attempt.toString
});

var propFailed = jsc.property("failed attempt -> hasPassed === false", attemptFailedSpec, function (arr) {
  return Attempt.hasPassed(arr) === false;
});

var propSucceeded = jsc.property("successful attempt -> hasPassed === true", attemptPassedSpec, function (arr) {
  return Attempt.hasPassed(arr) === true;
});

var concat1 = jsc.property('attempt.concat should pass if all true', jsc.array(attemptPassedSpec), function (attempts) {
  var result = Attempt.concat(attempts);
  return Attempt.hasPassed(result);
});

var concat2 = jsc.property('attempt.concat should fail if any have failed', jsc.array(attemptSpec), function (attempts) {
  var result = Attempt.concat(attempts);
  var allPassed = attempts.filter(Attempt.hasPassed).length === attempts.length;
  return Attempt.hasPassed(result) === allPassed;
});

var concat3 = jsc.property('attempt.concat should concatenate any error messages', jsc.array(attemptSpec), function (attempts) {
  var result = Attempt.concat(attempts);
  var failed = attempts.filter(function (at) { return !Attempt.hasPassed(at); });
  var failedErrors = failed.reduce(function (rest, f) {
    var current = Attempt.cata(f, function (x) {
      return x;
    }, function () {
      return [ ];
    });
    return rest.concat(current);
  }, []);

  return Attempt.cata(result, function (errs) {
    return jsc.utils.isEqual(errs, failedErrors);
  }, function (v) {
    return jsc.utils.isEqual([ ], failed);
  });
});
