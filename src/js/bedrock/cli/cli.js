const cloptions = require('./cloptions');
const commandLineArgs = require('command-line-args');
const attempt = require('../core/attempt');
const version = require('../core/version');
const validation = require('./validation');
const cliusage = require('./cliusage');

const exitcodes = require('../util/exitcodes');

const parseCommandLine = function (definitions) {
  try {
    const settings = commandLineArgs(definitions);
    return attempt.passed(settings);
  } catch (err) {
    return attempt.failed([err.message !== undefined ? err.message : err]);
  }
};

const extract = function (command, desc, definitions) {
  const parsed = parseCommandLine(definitions);


  attempt.cata(parsed, function () {
  }, function (s) {
    if (s.help === true) {
      // Print usage information if used with --help or -h.
      console.log(cliusage.generateUsage(command, desc, definitions));
      process.exit(exitcodes.success);
    } else if (s.version === true) {
      console.log(command + ' version: ' + version);
      process.exit(exitcodes.success);
    }
  });

  const extracted = attempt.list(parsed, [
    function (settings) {
      return validation.scan(definitions, settings);
    },
    function (results) {
      return validation.scanRequired(definitions, results);
    }
  ]);

  return attempt.cata(extracted, function (errs) {
    return attempt.failed({
      command: command,
      errors: errs,
      usage: cliusage.generateUsage(command, desc, definitions)
    });
  }, attempt.passed);
};

module.exports = {
  extract: extract
};
