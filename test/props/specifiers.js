var attempt = require('../../src/js/bedrock/core/attempt');
var jsc = require('jscheck');

var attemptSpec = function () {
  var success = jsc.boolean()();
  return success === true ? attemptPassedSpec() : attemptFailedSpec();
};

var attemptPassedSpec = function () {
  return attempt.passed(
    jsc.object(4)()
  );
};

var attemptFailedSpec = function () {
  return attempt.failed(
    jsc.array(
      jsc.number(10)(),
      jsc.string
    )()
  );
};

module.exports = {
  attemptSpec: attemptSpec,
  attemptPassedSpec: attemptPassedSpec,
  attemptFailedSpec: attemptFailedSpec
};