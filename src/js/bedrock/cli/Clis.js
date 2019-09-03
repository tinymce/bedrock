const cli = require('./Cli');
const ClOptions = require('./ClOptions');
const ExitCodes = require('../util/ExitCodes');

const commonOptions = function (directories) {
  return [
    ClOptions.projectdir(directories),
    ClOptions.basedir(directories),
    ClOptions.overallTimeout,
    ClOptions.singleTimeout,
    ClOptions.chunk,
    ClOptions.help,
    ClOptions.logging,
    ClOptions.version,
    ClOptions.bundler
  ];
};

const forAuto = function (directories) {
  return cli.extract(
    'bedrock-auto',
    'Use a Webdriver to launch a browser and run tests against it',
    commonOptions(directories).concat([
      ClOptions.browser,
      ClOptions.config,
      ClOptions.files,
      ClOptions.testdir,
      ClOptions.testdirs,
      ClOptions.name,
      ClOptions.output,
      ClOptions.debuggingPort,
      ClOptions.customRoutes,
      ClOptions.stopOnFailure,
      ClOptions.retries,
      ClOptions.delayExiting,
      ClOptions.useSandboxForHeadless,
      ClOptions.skipResetMousePosition,
      ClOptions.coverage
    ])
  );
};

const forManual = function (directories) {
  return cli.extract(
    'bedrock',
    'Launch a testing process on a localhost port and allow the user to navigate to it in any browser',
    commonOptions(directories).concat([
      ClOptions.stopOnFailure__hidden,
      ClOptions.config,
      ClOptions.files,
      ClOptions.testdir,
      ClOptions.testdirs,
      ClOptions.customRoutes,
      ClOptions.coverage
    ])
  );
};

const forFramework = function (directories) {
  return cli.extract(
    'bedrock-framework',
    'Load bedrock against a specific page using a framework',
    commonOptions(directories).concat([
      ClOptions.stopOnFailure,
      ClOptions.name,
      ClOptions.page,
      ClOptions.browser,
      ClOptions.output,
      ClOptions.framework,
      ClOptions.debuggingPort
    ])
  );
};

const logAndExit = function (errs) {
  console.error('\n****\nError while processing command line for ' + errs.command);
  const messages = errs.errors.join('\n');
  console.error(messages);
  console.error('Use ' + errs.command + ' --help to print usage\n****\n');
  process.exit(ExitCodes.failures.cli);
};

module.exports = {
  forAuto: forAuto,
  forManual: forManual,
  forFramework: forFramework,

  logAndExit: logAndExit
};
