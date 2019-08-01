var cli = require('./cli');
var cloptions = require('./cloptions');
var exitcodes = require('../util/exitcodes');

var commonOptions = function (directories) {
  return [
    cloptions.projectdir(directories),
    cloptions.basedir(directories),
    cloptions.overallTimeout,
    cloptions.singleTimeout,
    cloptions.chunk,
    cloptions.help,
    cloptions.logging,
    cloptions.version,
    cloptions.bundler,
    cloptions.bucket,
    cloptions.buckets
  ];
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
      cloptions.stopOnFailure,
      cloptions.retries,
      cloptions.delayExiting,
      cloptions.useSandboxForHeadless,
      cloptions.coverage,
    ])
  );
};

var forManual = function (directories) {
  return cli.extract(
    'bedrock',
    'Launch a testing process on a localhost port and allow the user to navigate to it in any browser',
    commonOptions(directories).concat([
      cloptions.stopOnFailure__hidden,
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
      cloptions.stopOnFailure,
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
  forAuto: forAuto,
  forManual: forManual,
  forFramework: forFramework,

  logAndExit: logAndExit
};