var cli = require('./cli.js');
var cloptions = require('./cloptions.js');

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
    cloptions.resultsSelector
  ];
};

var forAuto = function (directories) {
  return cli.extract(
    'bedrock-auto',
    'Use a Webdriver to launch a browser and run tests against it',
    directories, runnerOptions(directories).concat([
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
    directories, runnerOptions(directories).concat([
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
    directories, runnerOptions(directories).concat([
      cloptions.config,
      cloptions.files,
      cloptions.testdir,
      cloptions.uploaddirs,
      cloptions.bucket
    ])
  );
};

var forSauceSingle = function (directories) {
  return cli.extract(
    'bedrock-single-sauce',
    'Connect to a SauceLabs VM and run the tests',
    directories, runnerOptions(directories).concat([
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
    directories, runnerOptions(directories).concat([
      cloptions.uploaddirs,
      cloptions.bucket,
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


module.exports = {
  forAuto: forAuto,
  forManual: forManual,
  forRemote: forRemote,
  forSauceSingle: forSauceSingle,
  forSauce: forSauce
};