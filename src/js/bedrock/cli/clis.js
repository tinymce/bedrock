var cli = require('./cli');
var cloptions = require('./cloptions');

var runnerOptions = function (directories) {
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
    cloptions.help
  ];
};

var forAuto = function (directories) {
  return cli.extract(
    'bedrock-auto',
    'Use a Webdriver to launch a browser and run tests against it',
    runnerOptions(directories).concat([
      cloptions.browser,
      cloptions.config,
      cloptions.files,
      cloptions.testdir,
      cloptions.name,
      cloptions.output
    ])
  );
};

var forManual = function (directories) {
  return cli.extract(
    'bedrock',
    'Launch a testing process on a localhost port and allow the user to navigate to it in any browser',
    runnerOptions(directories).concat([
      cloptions.config,
      cloptions.files,
      cloptions.testdir
    ])
  );

};

var forRemote = function (directories) {
  return cli.extract(
    'bedrock-remote',
    'Launch a testing process on a remote machine and allow the user to navigate to it in any browser',
    runnerOptions(directories).concat([
      cloptions.config,
      cloptions.files,
      cloptions.testdir,
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
    runnerOptions(directories).concat([
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
    runnerOptions(directories).concat([
      cloptions.uploaddirs,
      cloptions.bucket,
      cloptions.bucketfolder,
      cloptions.config,
      cloptions.files,
      cloptions.testdir,
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
    runnerOptions(directories).concat([
      cloptions.name,
      cloptions.page
    ])
  );
};

var log = function (errs) {
  console.error('\n****\nError while processing command line for ' + errs.command);
  var messages = errs.errors.join('\n');
  console.error(messages);
  console.error('Use ' + errs.command + ' --help to print usage\n****\n');
};

module.exports = {
  forAuto: forAuto,
  forManual: forManual,
  forRemote: forRemote,
  forSauceSingle: forSauceSingle,
  forSauce: forSauce,
  forPage: forPage,

  log: log
};