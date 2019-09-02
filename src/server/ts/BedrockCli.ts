const Attempt = require('./bedrock/core/Attempt');
const Clis = require('./bedrock/cli/Clis');

const run = function (program, directories) {
  if (Clis[program.mode] === undefined) {
    throw new Error('Bedrock mode not known: ' + program.mode);
  }

  const maybeSettings = Clis[program.mode](directories);
  Attempt.cata(maybeSettings, Clis.logAndExit, function (settings) {
    program.go(settings, directories);
  });
};

module.exports = {
  run: run
};
