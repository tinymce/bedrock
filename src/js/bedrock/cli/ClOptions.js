const path = require('path');
const Extraction = require('./Extraction');

// Note, this is a blend of the previous hand-rolled cloption approach and
// the existing npm package: command-line-arguments
const name = {
  name: 'name',
  alias: 'n',
  type: String,
  defaultValue: 'bedrock-run',
  description: 'The name of the test run. It is used in reporting data',
  validate: Extraction.any
};

const output = {
  name: 'output',
  alias: 'o',
  type: String,
  defaultValue: 'scratch',
  description: 'The destination directory of the test reports',
  validate: Extraction.any
};

const browser = {
  name: 'browser',
  alias: 'b',
  type: String,
  required: true,
  description: 'The name of the browser to launch',
  validate: Extraction.inSet([
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

const bundler = {
  name: 'bundler',
  type: String,
  required: false,
  defaultValue: 'webpack',
  description: 'DISABLED: The name bundler to use webpack/rollup (forced webpack in this build)',
  validate: Extraction.inSet([
    'webpack',
    'rollup'
  ])
};

const configTo = function (defaultValue) {
  return {
    name: 'config',
    alias: 'c',
    type: String,
    defaultValue: defaultValue,
    description: 'The location of the typescript config file',
    validate: Extraction.file
  };
};

const config = configTo('tsconfig.json');

const files = {
  name: 'files',
  output: 'testfiles',
  alias: 'f',
  // Confusing.
  required: true,
  type: String,
  multiple: true,
  description: 'The list of files to test',
  validate: Extraction.file
};

const testdir = {
  name: 'testdir',
  output: 'testfiles',
  // Confusing
  required: true,

  alias: 'd',
  type: String,
  description: 'The directory containing all the files to test',
  validate: Extraction.files(['Test.js', 'Test.ts', 'Test.tsx'])
};

const testdirs = {
  name: 'testdirs',
  output: 'testfiles',
  required: true,
  type: String,
  multiple: true,
  flatten: true,
  description: 'The directories (plural) containing all the files to test',
  validate: Extraction.files(['Test.js', 'Test.ts', 'Test.tsx'])
};

const page = {
  name: 'page',
  output: 'page',
  required: true,
  type: String,
  description: 'The page to load into the browser',
  validate: Extraction.file
};

const projectdir = function (directories) {
  return {
    name: 'projectdir',
    alias: 'p',
    type: String,
    description: 'The base directory to host',
    validate: Extraction.any,
    defaultValue: directories.current,
    uncommon: true
  };
};

const basedir = function (directories) {
  return {
    name: 'basedir',
    type: String,
    description: 'The base directory of the bedrock program',
    validate: Extraction.any,
    defaultValue: path.join(directories.bin, '/..'),
    uncommon: true
  };
};

const debuggingPort = {
  name: 'debuggingPort',
  type: Number,
  description: 'The port for remote debugging (used for phantom and chrome-headless)',
  validate: Extraction.any,
  defaultValue: 9000,
  uncommon: true
};

const bucket = {
  name: 'bucket',
  type: Number,
  description: 'Which "bucket" of tests to run, if you split the test runs with "buckets" setting. 1-based.',
  validate: Extraction.any,
  defaultValue: 1,
  uncommon: true
};

const buckets = {
  name: 'buckets',
  type: Number,
  description: 'Number of "buckets" to split tests into. You can specify which bucket number to run, using the "bucket" setting. Useful for parallelizing tests over multiple build nodes.',
  validate: Extraction.any,
  defaultValue: 1,
  uncommon: true
};

const overallTimeout = {
  name: 'totalTimeout',
  type: Number,
  output: 'overallTimeout',
  description: 'The total amount of time in milliseconds the test can take before bedrock times out.',
  validate: Extraction.any,
  defaultValue: 10 * 60 * 1000,
  uncommon: true
};

const singleTimeout = {
  name: 'singleTimeout',
  type: Number,
  description: 'The total amount of time in milliseconds a single test can take before bedrock times out.',
  validate: Extraction.any,
  defaultValue: 30 * 1000,
  uncommon: true
};

const framework = {
  name: 'framework',
  type: String,
  defaultValue: 'qunit',
  description: 'The testing framework being used',
  validate: Extraction.inSet(['qunit']),
  required: true
};

const help = {
  name: 'help',
  alias: 'h',
  type: Boolean,
  defaultValue: false,
  description: 'Print out the help information for command',
  validate: Extraction.any
};

const logging = {
  name: 'loglevel',
  type: String,
  defaultValue: 'advanced',
  description: 'The level of logging for test progress',
  validate: Extraction.inSet(['simple', 'advanced']),
  required: true
};

const version = {
  name: 'version',
  type: Boolean,
  defaultValue: false,
  description: 'Output the version number of the command',
  validate: Extraction.any
};

const chunk = {
  name: 'chunk',
  type: Number,
  description: 'Run tests in groups of this size, reload page between.',
  validate: Extraction.any,
  defaultValue: 100,
  uncommon: true
};

const retries = {
  name: 'retries',
  type: Number,
  description: 'Retry failing tests this many times. Ignored with stopOnFailure.',
  validate: Extraction.any,
  defaultValue: 0
};

const stopOnFailure = {
  name: 'stopOnFailure',
  type: Boolean,
  defaultValue: false,
  description: 'Stop after the first failure',
  validate: Extraction.any
};

// eslint-disable-next-line camelcase
const stopOnFailure__hidden = {
  name: 'stopOnFailure',
  type: Boolean,
  defaultValue: false,
  validate: Extraction.any,
  hidden: true
};

const customRoutes = {
  name: 'customRoutes',
  type: String,
  description: 'File with custom static routes',
  validate: Extraction.file,
  uncommon: true
};

const delayExiting = {
  name: 'delayExit',
  type: Boolean,
  defaultValue: false,
  description: 'After the tests have completed, delay quitting the server',
  validate: Extraction.any
};

const useSandboxForHeadless = {
  name: 'useSandboxForHeadless',
  type: Boolean,
  defaultValue: false,
  description: 'Pass --no-sandbox through to chrome headless options',
  validate: Extraction.any,
  uncommon: true
};

const coverage = {
  name: 'coverage',
  output: 'coverage',
  type: String,
  description: 'Path to generate code coverage on',
  uncommon: true,
  multiple: true,
  flatten: true,
  validate: Extraction.directory
};

const skipResetMousePosition = {
  name: 'skipResetMousePosition',
  type: Boolean,
  defaultValue: false,
  description: 'Prevent bedrock from resetting the mouse position to the top left corner of the screen between each test',
  validate: Extraction.any,
  uncommon: true
};

module.exports = {
  // All modes testing
  config: config,
  configTo: configTo,
  files: files,
  testdir: testdir,
  testdirs: testdirs,
  bucket,
  buckets,
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
  useSandboxForHeadless: useSandboxForHeadless,
  page: page,
  logging: logging,
  skipResetMousePosition: skipResetMousePosition
};
