var tape = require('tape');
var attempt = require('../../src/js/bedrock/core/attempt.js');

var assertErrors = function (t, expected, actual) {
  attempt.cata(actual, function (errs) {
    t.deepEquals(errs, expected);
    t.end();
  }, function (result) {
    t.fail('Expected errors: ' + JSON.stringify(expected));
    t.end();
  });
};

var assertResult = function (t, expected, actual) {
  attempt.cata(actual, function (errs) {
    t.fail('Unexpected errors: ' + JSON.stringify(errs));
    t.end();
  }, function (result) {
    t.deepEquals(result, expected);
    t.end();
  });
};

module.exports = {
  assertErrors: assertErrors,
  assertResult: assertResult
};