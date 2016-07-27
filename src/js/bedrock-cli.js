var run = function (program, directories) {
  var attempt = require('./bedrock/core/attempt');
  var clis = require('./bedrock/cli/clis');

  if (clis[program.mode] === undefined)  throw 'Bedrock mode not known: ' + program.mode;

  var maybeSettings = clis[program.mode](directories);
  attempt.cata(maybeSettings, clis.logAndExit, function (settings) {
    program.go(settings, directories);
  });
};

module.exports = {
  run: run
};
