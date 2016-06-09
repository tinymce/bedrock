var tape = require('tape');
var attempt = require('../../src/js/bedrock/core/attempt.js');
var attemptutils = require('../util/attempt-utils.js');

// TODO: Investigate invariant testing in tape/node.

tape('attempt.carry [ f([err1]), f([err2]) ]', function (t) {
  attemptutils.assertErrors(t, [ 'err1', 'err2' ], attempt.carry(
    attempt.failed([ 'err1' ]),
    attempt.failed([ 'err2' ])
  ), attempt.passed);
});

tape('attempt.carry [ f([err1]), p(good) ]', function (t) {
  attemptutils.assertErrors(t, [ 'err1' ], attempt.carry(
    attempt.failed([ 'err1' ]),
    attempt.passed('good')
  ), attempt.passed);
});

tape('attempt.carry [ p(good), f([bad]) ]', function (t) {
  attemptutils.assertErrors(t, [ 'bad' ], attempt.carry(
    attempt.passed('good'),
    attempt.failed([ 'bad' ]),
    attempt.passed
  ));
});

tape('attempt.concat [ ]', function (t) {
  attemptutils.assertResult(t, [ ], attempt.concat([

  ]));
});

tape('attempt.concat [ p(1) ]', function (t) {
  attemptutils.assertResult(t, [ 1 ], attempt.concat([
    attempt.passed(1)
  ]));
});

tape('attempt.concat [ p(1), p(2), p(3) ]', function (t) {
  attemptutils.assertResult(t, [ 1, 2, 3 ], attempt.concat([
    attempt.passed(1),
    attempt.passed(2),
    attempt.passed(3)
  ]));
});

tape('attempt.concat [ p(1), f([message]), p(3) ]', function (t) {
  attemptutils.assertErrors(t, [ 'message1', 'message2' ], attempt.concat([
    attempt.passed(1),
    attempt.failed([ 'message1', 'message2' ]),
    attempt.passed(3)
  ]));
});

tape('attempt.concat [ p(1), f([message1,2]), f([message3,4]) ]', function (t) {
  attemptutils.assertErrors(t, [ 'message1', 'message2', 'message3', 'message4' ], attempt.concat([
    attempt.passed(1),
    attempt.failed([ 'message1', 'message2' ]),
    attempt.failed([ 'message3', 'message4' ])
  ]));
});

tape('attempt.list p(1) -> [ =>f[a], =>p(1) ]', function (t) {
  attemptutils.assertErrors(t, [ 'f.1' ], attempt.list(attempt.passed(1), [
    function (i) { return attempt.failed([ 'f.' + i ]); },
    function (j) { return attempt.passed('done'); }
  ]));
});

tape('attempt.list p(1) -> [ =>p(1.*), =>p(2.*), =>p(3.*) ]', function (t) {
  attemptutils.assertResult(t, '3.2.1.0', attempt.list(attempt.passed('0'), [
    function (i) { return attempt.passed('1.' + i); },
    function (i) { return attempt.passed('2.' + i); },
    function (i) { return attempt.passed('3.' + i); }
  ]));
});