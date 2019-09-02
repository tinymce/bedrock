const attempt = require('./bedrock/core/Attempt');
const clis = require('./bedrock/cli/Clis');

const run = function (program, directories) {
  if (clis[program.mode] === undefined) throw 'Bedrock mode not known: ' + program.mode;

  const maybeSettings = clis[program.mode](directories);
  attempt.cata(maybeSettings, clis.logAndExit, function (settings) {
    program.go(settings, directories);
  });
};

module.exports = {
  run: run
};
