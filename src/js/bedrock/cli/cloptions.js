  var path = require('path');
  var extraction = require('./extraction.js');

  // Note, this is a blend of the previous hand-rolled cloption approach and
  // the existing npm package: command-line-arguments
  var name = {
    name: 'name',
    alias: 'n',
    type: String,
    defaultValue: 'bedrock-run',
    description: 'The name of the test run. It is used in reporting data',
    validate: extraction.any
  };

  var output = {
    name: 'output',
    alias: 'o',
    type: String,
    defaultValue: 'scratch',
    description: 'The destination directory of the test reports',
    validate: extraction.any
  };

  var browser = {
    name: 'browser',
    alias: 'b',
    type: String,
    required: true,
    description: 'The name of the browser to launch',
    validate: extraction.inSet([
      'ie',
      'firefox',
      'MicrosoftEdge',
      'chrome',
      'safari'
    ])
  };

  var configTo = function (defaultValue) {
    return {
      name: 'config',
      alias: 'c',
      type: String,
      defaultValue: defaultValue,
      description: 'The location of the bolt config file',
      validate: extraction.file
    };
  };

  var config = configTo('config/bolt/browser.js');

  var files = {
    name: 'files',
    output: 'testfiles',
    alias: 'f',
    // Confusing.
    required: true,
    type: String,
    multiple: true,
    description: 'The list of files to test',
    validate: extraction.file
  };

  var testdir = {
    name: 'testdir',
    output: 'testfiles',
    // Confusing
    required: true,

    alias: 'd',
    type: String,
    description: 'The directory containing all the files to test',
    validate: extraction.files('Test.js')
  };

  var projectdir = function (directories) {
    return {
      name: 'projectdir',
      alias: 'p',
      type: String,
      description: 'The base directory to host',
      validate: extraction.any,
      defaultValue: directories.current,
      uncommon: true
    };
  };

  var basedir = function (directories) {
    return {
      name: 'basedir',
      type: String,
      description: 'The base directory of the bedrock program',
      validate: extraction.any,
      defaultValue: path.join(directories.bin, '/..'),
      uncommon: true
    };
  };

  var uploaddirs = {
    name: 'uploaddirs',
    alias: 'u',
    type: String,
    multiple: true,
    description: 'The directories (from the project directory) to upload',
    validate: extraction.directory,
    defaultValue: [ 'src', 'test', 'config', 'lib' ],
  };

  var bucket = {
    name: 'bucket',
    type: String,
    description: 'The name of the AWS bucket',
    validate: extraction.any,
    required: true
  };

  var saucebrowser = {
    name: 'saucebrowser',
    type: String,
    description: 'The name of the browser to launch on SauceLabs',
    validate: extraction.inSet([ 'MicrosoftEdge', 'internet explorer', 'firefox', 'chrome', 'safari' ]),
    defaultValue: 'chrome'
  };

  var sauceos = {
    name: 'sauceos',
    type: String,
    description: 'The operating system of the VM to launch on SauceLabs',
    validate: extraction.inSet([ 'Windows 10', 'Windows 8.1', 'OSX 10.9', 'Linux' ]),
    defaultValue: 'Linux'
  };

  var saucebrowserVersion = {
    name: 'saucebrowserVersion',
    type: String,
    description: 'The browser version to run on SauceLabs',
    validate: extraction.any,
    defaultValue: 'latest'
  };

  var sauceuser = {
    name: 'sauceuser',
    type: String,
    description: 'The username for SauceLabs',
    validate: extraction.any,
    required: true
  };

  var saucekey = {
    name: 'saucekey',
    type: String,
    description: 'The key for SauceLabs',
    validate: extraction.any,
    required: true
  };

  var remoteurl = {
    name: 'remoteurl',
    type: String,
    description: 'The URL of the uploaded project',
    validate: extraction.any,
    required: true
  };

  var overallTimeout = {
    name: 'totalTimeout',
    type: Number,
    description: 'The total amount of time the test can take before bedrock times out.',
    validate: extraction.any,
    defaultValue: 10 * 60 * 1000,
    uncommon: true
  };

  var singleTimeout = {
    name: 'singleTimeout',
    type: Number,
    description: 'The total amount of time a single test can take before bedrock times out.',
    validate: extraction.any,
    defaultValue: 30 * 1000,
    uncommon: true
  };

  var doneSelector = {
    name: 'done',
    type: String,
    description: 'The CSS selector representing the state where tests have completed',
    defaultValue: 'div.done',
    uncommon: true,
    validate: extraction.any
  };

  var progressSelector = {
    name: 'progress',
    type: String,
    defaultValue: '.progress',
    description: 'The CSS selector representing the element containing the current number of tests run',
    uncommon: true,
    validate: extraction.any
  };

  var totalSelector = {
    name: 'total',
    type: String,
    defaultValue: '.total',
    description: 'The CSS selector representing the element containing the total number of tests',
    uncommon: true,
    validate: extraction.any
  };

  var testNameSelector = {
    name: 'testName',
    type: String,
    defaultValue: '.test.running .name',
    description: 'The CSS selector representing the name of the current test',
    uncommon: true,
    validate: extraction.any
  };

  var resultsSelector = {
    name: 'results',
    type: String,
    defaultValue: 'textarea.results',
    description: 'The CSS selector representing the JSON output of running the tests',
    uncommon: true,
    validate: extraction.any
  };

  module.exports = {
    // All modes testing
    config: config,
    configTo: configTo,
    files: files,
    testdir: testdir,

    // Webdriver testing
    name: name,
    output: output,
    browser: browser,

    // Remote testing
    uploaddirs: uploaddirs,
    bucket: bucket,

    // Saucelabs testing
    remoteurl: remoteurl,
    saucebrowser: saucebrowser,
    saucebrowserVersion: saucebrowserVersion,
    sauceos: sauceos,
    sauceuser: sauceuser,
    saucekey: saucekey,

    // Test driver settings
    doneSelector: doneSelector,
    projectdir: projectdir,
    basedir: basedir,
    overallTimeout: overallTimeout,
    singleTimeout: singleTimeout,
    progressSelector: progressSelector,
    totalSelector: totalSelector,
    testNameSelector: testNameSelector,
    resultsSelector: resultsSelector
  };

      // cloptions.saucebrowser, ***
      // cloptions.config, ***
      // cloptions.files,
      // cloptions.testdir,
      // cloptions.name,
      // cloptions.sauceos,
      // cloptions.saucebrowserVersion,
      // cloptions.sauceuser,
      // cloptions.saucekey,
      // cloptions.output