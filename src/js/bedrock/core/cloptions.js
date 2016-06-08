  var cloption = require('./cloption.js');
  var path = require('path');

  // Note, this is a blend of the previous hand-rolled cloption approach and
  // the existing npm package: command-line-arguments
  var name = {
    name: 'name',
    alias: 'n',
    type: String,
    defaultValue: 'bedrock-run-' + new Date().getTime(),
    description: 'The name of the test run. It is used in reporting data.',
    validate: cloption.isAny
  };

  var output = {
    name: 'output',
    alias: 'o',
    type: String,
    defaultValue: 'scratch',
    description: 'The destination directory of the test reports',
    validate: cloption.isAny
  };

  var browser = {
    name: 'browser',
    alias: 'b',
    type: String,
    required: true,
    description: 'The name of the browser to launch',
    validate: cloption.isOneOf([
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
      validate: cloption.validateFile
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
    incompatible: [
      'testdir'
    ],
    description: 'The list of files to test',
    validate: cloption.validateFile
  };

  var testdir = {
    name: 'testdir',
    output: 'testfiles',
    // Confusing
    required: true,

    alias: 'd',
    type: String,
    description: 'The directory containing all the files to test',
    validate: cloption.listDirectory('Test.js')
  };

  var projectdir = function (directories) {
    return {
      name: 'projectdir',
      alias: 'p',
      type: String,
      description: 'The base directory to host',
      validate: cloption.isAny,
      defaultValue: directories.current,
      uncommon: true
    };
  };

  var basedir = function (directories) {
    return {
      name: 'basedir',
      type: String,
      description: 'The base directory of the bedrock program',
      validate: cloption.isAny,
      defaultValue: path.join(directories.bin, '/..'),
      uncommon: true
    };
  };

  var overallTimeout = {
    name: 'totalTimeout',
    type: Number,
    description: 'The total amount of time the test can take before bedrock times out.',
    validate: cloption.isAny,
    defaultValue: 10 * 60 * 1000,
    uncommon: true
  };

  var singleTimeout = {
    name: 'singleTimeout',
    type: Number,
    description: 'The total amount of time a single test can take before bedrock times out.',
    validate: cloption.isAny,
    defaultValue: 30 * 1000,
    uncommon: true
  };

  var doneSelector = {
    name: 'doneSelector',
    type: String,
    description: 'The CSS selector representing the state where tests have completed',
    defaultValue: 'div.done',
    uncommon: true,
    validate: cloption.isAny
  };

  var progressSelector = {
    name: 'progressSelector',
    type: String,
    defaultValue: '.progress',
    description: 'The CSS selector representing the element containing the current number of tests run',
    uncommon: true,
    validate: cloption.isAny
  };

  var totalSelector = {
    name: 'totalSelector',
    type: String,
    defaultValue: '.total',
    description: 'The CSS selector representing the element containing the total number of tests',
    uncommon: true,
    validate: cloption.isAny
  };

  var testNameSelector = {
    name: 'testNameSelector',
    type: String,
    defaultValue: '.test.running .name',
    description: 'The CSS selector representing the name of the current test',
    uncommon: true,
    validate: cloption.isAny
  };

  var resultsSelector = {
    name: 'resultsSelector',
    type: String,
    defaultValue: 'textarea.results',
    description: 'The CSS selector representing the JSON output of running the tests',
    uncommon: true,
    validate: cloption.isAny
  };

  module.exports = {
    name: name,
    output: output,
    browser: browser,
    config: config,
    configTo: configTo,
    files: files,
    testdir: testdir,

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