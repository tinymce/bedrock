var cloptions = require('./cloptions');
var commandLineArgs = require('command-line-args');
var attempt = require('../core/attempt');
var validation = require('./validation');
var cliusage = require('./cliusage');

var exitcodes = require('../util/exitcodes');

var parseCommandLine = function (definitions) {
  try {
    var settings = commandLineArgs(definitions);
    return attempt.passed(settings);
  } catch (err) {
    return attempt.failed([ err.message !== undefined ? err.message : err ]);
  }
};

var getVersion = function () {
  // NOTE: Do not run browserify if this is here.
  var npmInfo = require('../../../../package.json');
  return npmInfo.version;
};

var extract = function (command, desc, definitions) {
  var parsed = parseCommandLine(definitions);


  attempt.cata(parsed, function () {
  }, function (s) {
    if (s.help === true) {
      // Print usage information if used with --help or -h.
      console.log(cliusage.generateUsage(command, desc, definitions));
      process.exit(exitcodes.success);
    } else if (s.version === true) {
      console.log(command + ' version: ' + getVersion());
      process.exit(exitcodes.success);
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
