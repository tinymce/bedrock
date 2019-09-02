const commandLineArgs = require('command-line-args');
const Attempt = require('../core/Attempt');
const Version = require('../core/Version');
const Validation = require('./Validation');
const CliUsage = require('./CliUsage');
const ExitCodes = require('../util/ExitCodes');

const parseCommandLine = function (definitions) {
  try {
    const settings = commandLineArgs(definitions);
    return Attempt.passed(settings);
  } catch (err) {
    return Attempt.failed([err.message !== undefined ? err.message : err]);
  }
};

const extract = function (command, desc, definitions) {
  const parsed = parseCommandLine(definitions);


  Attempt.cata(parsed, function () {
  }, function (s) {
    if (s.help === true) {
      // Print usage information if used with --help or -h.
      console.log(CliUsage.generateUsage(command, desc, definitions));
      process.exit(ExitCodes.success);
    } else if (s.version === true) {
      console.log(command + ' version: ' + Version);
      process.exit(ExitCodes.success);
    }
  });

  const extracted = Attempt.list(parsed, [
    function (settings) {
      return Validation.scan(definitions, settings);
    },
    function (results) {
      return Validation.scanRequired(definitions, results);
    }
  ]);

  return Attempt.cata(extracted, function (errs) {
    return Attempt.failed({
      command: command,
      errors: errs,
      usage: CliUsage.generateUsage(command, desc, definitions)
    });
  }, Attempt.passed);
};

module.exports = {
  extract: extract
};
