var tape = require('tape');
var Attempt = require('../../lib/server/ts/bedrock/core/Attempt.js').Attempt;
var AttemptUtils = require('../util/AttemptUtils.js');

// TODO: Investigate invariant testing in tape/node.

tape('attempt.carry [ f([err1]), f([err2]) ]', function (t) {
  AttemptUtils.assertErrors(t, [ 'err1', 'err2' ], Attempt.carry(
    Attempt.failed([ 'err1' ]),
    Attempt.failed([ 'err2' ])
  ), Attempt.passed);
});

tape('attempt.carry [ f([err1]), p(good) ]', function (t) {
  AttemptUtils.assertErrors(t, [ 'err1' ], Attempt.carry(
    Attempt.failed([ 'err1' ]),
    Attempt.passed('good')
  ), Attempt.passed);
});

tape('attempt.carry [ p(good), f([bad]) ]', function (t) {
  AttemptUtils.assertErrors(t, [ 'bad' ], Attempt.carry(
    Attempt.passed('good'),
    Attempt.failed([ 'bad' ]),
    Attempt.passed
  ));
});

tape('attempt.concat [ ]', function (t) {
  AttemptUtils.assertResult(t, [ ], Attempt.concat([

  ]));
});

tape('attempt.concat [ p(1) ]', function (t) {
  AttemptUtils.assertResult(t, [ 1 ], Attempt.concat([
    Attempt.passed(1)
  ]));
});

tape('attempt.concat [ p(1), p(2), p(3) ]', function (t) {
  AttemptUtils.assertResult(t, [ 1, 2, 3 ], Attempt.concat([
    Attempt.passed(1),
    Attempt.passed(2),
    Attempt.passed(3)
  ]));
});

tape('attempt.concat [ p(1), f([message]), p(3) ]', function (t) {
  AttemptUtils.assertErrors(t, [ 'message1', 'message2' ], Attempt.concat([
    Attempt.passed(1),
    Attempt.failed([ 'message1', 'message2' ]),
    Attempt.passed(3)
  ]));
});

tape('attempt.concat [ p(1), f([message1,2]), f([message3,4]) ]', function (t) {
  AttemptUtils.assertErrors(t, [ 'message1', 'message2', 'message3', 'message4' ], Attempt.concat([
    Attempt.passed(1),
    Attempt.failed([ 'message1', 'message2' ]),
    Attempt.failed([ 'message3', 'message4' ])
  ]));
});

tape('attempt.list p(1) -> [ =>f[a], =>p(1) ]', function (t) {
  AttemptUtils.assertErrors(t, [ 'f.1' ], Attempt.list(Attempt.passed(1), [
    function (i) { return Attempt.failed([ 'f.' + i ]); },
    function (j) { return Attempt.passed('done'); }
  ]));
});

tape('attempt.list p(1) -> [ =>p(1.*), =>p(2.*), =>p(3.*) ]', function (t) {
  AttemptUtils.assertResult(t, '3.2.1.0', Attempt.list(Attempt.passed('0'), [
    function (i) { return Attempt.passed('1.' + i); },
    function (i) { return Attempt.passed('2.' + i); },
    function (i) { return Attempt.passed('3.' + i); }
  ]));
});
