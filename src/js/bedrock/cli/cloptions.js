  var path = require('path');
  var extraction = require('./extraction');

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
      'firefox-headless',
      'MicrosoftEdge',
      'chrome',
      'chrome-headless',
      'safari',
      'phantomjs'
    ])
  };

  var bundler = {
    name: 'bundler',
    type: String,
    required: false,
    defaultValue: 'webpack',
    description: 'DISABLED: The name bundler to use webpack/rollup (forced webpack in this build)',
    validate: extraction.inSet([
      'webpack',
      'rollup'
    ])
  };

  var configTo = function (defaultValue) {
    return {
      name: 'config',
      alias: 'c',
      type: String,
      defaultValue: defaultValue,
      description: 'The location of the typescript config file',
      validate: extraction.file
    };
  };

  var config = configTo('tsconfig.json');

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
    validate: extraction.files(['Test.js', 'Test.ts', 'Test.tsx'])
  };

  var testdirs = {
    name: 'testdirs',
    output: 'testfiles',
    required: true,
    type: String,
    multiple: true,
    flatten: true,
    description: 'The directories (plural) containing all the files to test',
    validate: extraction.files(['Test.js', 'Test.ts', 'Test.tsx'])
  };

  var page = {
    name: 'page',
    output: 'page',
    required: true,
    type: String,
    description: 'The page to load into the browser',
    validate: extraction.file
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

  var debuggingPort = {
    name: 'debuggingPort',
    type: Number,
    description: 'The port for remote debugging (used for phantom and chrome-headless)',
    validate: extraction.any,
    defaultValue: 9000,
    uncommon: true
  };

  var overallTimeout = {
    name: 'totalTimeout',
    type: Number,
    output: 'overallTimeout',
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

  var framework = {
    name: 'framework',
    type: String,
    defaultValue: 'qunit',
    description: 'The testing framework being used',
    validate: extraction.inSet([ 'qunit' ]),
    required: true
  };

  var help = {
    name: 'help',
    alias: 'h',
    type: Boolean,
    defaultValue: false,
    description: 'Print out the help information for command',
    validate: extraction.any
  };

  var logging = {
    name: 'loglevel',
    type: String,
    defaultValue: 'advanced',
    description: 'The level of logging for test progress',
    validate: extraction.inSet([ 'simple', 'advanced' ]),
    required: true
  };

  var version = {
    name: 'version',
    type: Boolean,
    defaultValue: false,
    description: 'Output the version number of the command',
    validate: extraction.any
  };

  var chunk = {
    name: 'chunk',
    type: Number,
    description: 'Run tests in groups of this size, reload page between.',
    validate: extraction.any,
    defaultValue: 100,
    uncommon: true
  };

  var retries = {
    name: 'retries',
    type: Number,
    description: 'Retry failing tests this many times. Ignored with stopOnFailure.',
    validate: extraction.any,
    defaultValue: 0
  };

  var stopOnFailure = {
    name: 'stopOnFailure',
    type: Boolean,
    defaultValue: false,
    description: 'Stop after the first failure',
    validate: extraction.any
  };

  var stopOnFailure__hidden = {
    name: 'stopOnFailure',
    type: Boolean,
    defaultValue: false,
    validate: extraction.any,
    hidden: true
  };

  var customRoutes = {
    name: 'customRoutes',
    type: String,
    description: 'File with custom static routes',
    validate: extraction.file,
    uncommon: true
  };

  var delayExiting = {
    name: 'delayExit',
    type: Boolean,
    defaultValue: false,
    description: 'After the tests have completed, delay quitting the server',
    validate: extraction.any
  };

  var coverage = {
    name: 'coverage',
    output: 'coverage',
    type: String,
    description: 'Path to generate code coverage on',
    uncommon: true,
    multiple: true,
    flatten: true,
    validate: extraction.directory
  };

  module.exports = {
    // All modes testing
    config: config,
    configTo: configTo,
    files: files,
    testdir: testdir,
    testdirs: testdirs,
    customRoutes: customRoutes,
    bundler: bundler,
    coverage,

    // Webdriver testing
    name: name,
    output: output,
    browser: browser,

    // Test driver settings
    projectdir: projectdir,
    basedir: basedir,
    overallTimeout: overallTimeout,
    singleTimeout: singleTimeout,

    // Phantom settings
    debuggingPort: debuggingPort,

    framework: framework,
    help: help,
    version: version,
    chunk: chunk,
    retries: retries,
    stopOnFailure: stopOnFailure,
    stopOnFailure__hidden: stopOnFailure__hidden,
    delayExiting: delayExiting,
    page: page,
    logging: logging
  };