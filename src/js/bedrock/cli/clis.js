var cli = require('./cli');
var cloptions = require('./cloptions');

var commonOptions = function (directories) {
  return [
    cloptions.doneSelector,
    cloptions.projectdir(directories),
    cloptions.basedir(directories),
    cloptions.overallTimeout,
    cloptions.singleTimeout,
    cloptions.progressSelector,
    cloptions.totalSelector,
    cloptions.testNameSelector,
    cloptions.resultsSelector,
    cloptions.stopOnFailure,
    cloptions.help,
    cloptions.logging,
    cloptions.version
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
      cloptions.customRoutes
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
      cloptions.customRoutes
    ])
  );
};

var forRemote = function (directories) {
  return cli.extract(
    'bedrock-remote',
    'Launch a testing process on a remote machine and allow the user to navigate to it in any browser',
    commonOptions(directories).concat([
      cloptions.config,
      cloptions.files,
      cloptions.testdir,
      cloptions.testdirs,
      cloptions.uploaddirs,
      cloptions.bucket,
      cloptions.bucketfolder
    ])
  );
};

var forSauceSingle = function (directories) {
  return cli.extract(
    'bedrock-single-sauce',
    'Connect to a SauceLabs VM and run the tests',
    commonOptions(directories).concat([
      cloptions.remoteurl,
      cloptions.saucebrowser,
      cloptions.name,
      cloptions.sauceos,
      cloptions.saucebrowserVersion,
      cloptions.sauceuser,
      cloptions.saucekey,
      cloptions.output
    ])
  );
};

var forSauce = function (directories) {
  return cli.extract(
    'bedrock-sauce',
    'Connect to the SauceLabs VMs specified by a json file and run the tests',
    commonOptions(directories).concat([
      cloptions.uploaddirs,
      cloptions.bucket,
      cloptions.bucketfolder,
      cloptions.config,
      cloptions.files,
      cloptions.testdir,
      cloptions.testdirs,
      cloptions.name,
      cloptions.sauceconfig,
      cloptions.sauceuser,
      cloptions.saucekey,
      cloptions.output
    ])
  );
};

var forPage = function (directories) {
  return cli.extract(
    'bedrock-page',
    'Load bedrock against a specific page',
    commonOptions(directories).concat([
      cloptions.name,
      cloptions.page,
      cloptions.browser,
      cloptions.output,
      cloptions.framework
    ])
  );
};

var logAndExit = function (errs) {
  console.error('\n****\nError while processing command line for ' + errs.command);
  var messages = errs.errors.join('\n');
  console.error(messages);
  console.error('Use ' + errs.command + ' --help to print usage\n****\n');
  process.exit(-1);
};

module.exports = {
  forRepl: forRepl,
  forAuto: forAuto,
  forManual: forManual,
  forRemote: forRemote,
  forSauceSingle: forSauceSingle,
  forSauce: forSauce,
  forPage: forPage,

  logAndExit: logAndExit
};