var cloptions = require('./cloptions.js');
var commandLineArgs = require('command-line-args');
var attempt = require('../core/attempt.js');
var validation = require('./validation.js');
var cliusage = require('./cliusage.js');

var parseCommandLine = function (definitions) {
  try {
    var settings = commandLineArgs(definitions);
    return attempt.passed(settings);
  } catch (err) {
    return attempt.failed([ err.message !== undefined ? err.message : err ]);
  }
};

var extract = function (command, desc, definitions) {
  var parsed = parseCommandLine(definitions);


  attempt.cata(parsed, function () {
  }, function (s) {
    if (s.help === true) {
      // Print usage information if used with --help or -h.
      console.log(cliusage.generateUsage(command, desc, definitions));
      process.exit(0);
    }
  });

  var extracted = attempt.list(parsed, [
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
