var cli = require('./cli');
var cloptions = require('./cloptions');
var exitcodes = require('../util/exitcodes');

var commonOptions = function (directories) {
  return [
    cloptions.projectdir(directories),
    cloptions.basedir(directories),
    cloptions.overallTimeout,
    cloptions.singleTimeout,
    cloptions.stopOnFailure,
    cloptions.chunk,
    cloptions.retries,
    cloptions.help,
    cloptions.logging,
    cloptions.version,
    cloptions.bundler
  ];
};

var forRepl = function (directories) {
  return cli.extract(
    'bedrock-repl',
    'Open a project repl on a port',
    [
      cloptions.projectdir(directories),
      cloptions.basedir(directories),
      cloptions.config,
      cloptions.help,
      cloptions.version,
      cloptions.repl
    ]
  );
};

var forAuto = function (directories) {
  return cli.extract(
    'bedrock-auto',
    'Use a Webdriver to launch a browser and run tests against it',
    commonOptions(directories).concat([
      cloptions.browser,
      cloptions.config,
      cloptions.files,
      cloptions.testdir,
      cloptions.testdirs,
      cloptions.name,
      cloptions.output,
      cloptions.debuggingPort,
      cloptions.customRoutes,
      cloptions.delayExiting,
      cloptions.coverage
    ])
  );
};

var forManual = function (directories) {
  return cli.extract(
    'bedrock',
    'Launch a testing process on a localhost port and allow the user to navigate to it in any browser',
    commonOptions(directories).concat([
      cloptions.config,
      cloptions.files,
      cloptions.testdir,
      cloptions.testdirs,
      cloptions.customRoutes,
      cloptions.coverage
    ])
  );
};

var forFramework = function (directories) {
  return cli.extract(
    'bedrock-framework',
    'Load bedrock against a specific page using a framework',
    commonOptions(directories).concat([
      cloptions.name,
      cloptions.page,
      cloptions.browser,
      cloptions.output,
      cloptions.framework,
      cloptions.debuggingPort
    ])
  );
};

var logAndExit = function (errs) {
  console.error('\n****\nError while processing command line for ' + errs.command);
  var messages = errs.errors.join('\n');
  console.error(messages);
  console.error('Use ' + errs.command + ' --help to print usage\n****\n');
  process.exit(exitcodes.failures.cli);
};

module.exports = {
  forRepl: forRepl,
  forAuto: forAuto,
  forManual: forManual,
  forFramework: forFramework,

  logAndExit: logAndExit
};