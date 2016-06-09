var run = function (program, directories) {
  var attempt = require('./bedrock/core/attempt');
  var clis = require('./bedrock/cli/clis.js');

  var maybeSettings = clis[program.mode](directories);
  attempt.cata(maybeSettings, clis.log, program.go);
};

module.exports = {
  run: run
};
