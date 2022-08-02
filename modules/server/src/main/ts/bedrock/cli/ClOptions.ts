import * as path from 'path';
import * as Extraction from './Extraction';
import { OptionDefinition } from 'command-line-args';
import { Attempt } from '../core/Attempt';

export interface ClOption extends OptionDefinition {
  required?: boolean;
  output?: string;
  uncommon?: boolean;
  flatten?: boolean;
  description: string;
  validate: (n: string, v: string) => Attempt<string[], any>; // TODO: stronger type
  hidden?: boolean;
}

// Note, this is a blend of the previous hand-rolled cloption approach and
// the existing npm package: command-line-arguments
export const name: ClOption = {
  name: 'name',
  alias: 'n',
  type: String,
  defaultValue: 'bedrock-run',
  description: 'The name of the test run. It is used in reporting data',
  validate: Extraction.any
};

export const output: ClOption = {
  name: 'output',
  alias: 'o',
  type: String,
  defaultValue: 'scratch',
  description: 'The destination directory of the test reports',
  validate: Extraction.any
};

export const browser: ClOption = {
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

export const bundler: ClOption = {
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

export const configTo = (defaultValue: string): ClOption => {
  return {
    name: 'config',
    alias: 'c',
    type: String,
    defaultValue,
    description: 'The location of the typescript config file',
    validate: Extraction.any
  };
};

export const config: ClOption = configTo('tsconfig.json');

export const files: ClOption = {
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

export const testdir: ClOption = {
  name: 'testdir',
  output: 'testfiles',
  // Confusing
  required: true,

  alias: 'd',
  type: String,
  description: 'The directory containing all the files to test',
  validate: Extraction.files(['Test.js', 'Test.ts', 'Test.tsx', 'Test.mjs', 'Test.bs.js'])
};

export const testdirs: ClOption = {
  name: 'testdirs',
  output: 'testfiles',
  required: true,
  type: String,
  multiple: true,
  flatten: true,
  description: 'The directories (plural) containing all the files to test',
  validate: Extraction.files(['Test.js', 'Test.ts', 'Test.tsx', 'Test.mjs', 'Test.bs.js'])
};

export const projectdir = (currentDir: string): ClOption => {
  return {
    name: 'projectdir',
    alias: 'p',
    type: String,
    description: 'The base directory to host',
    validate: Extraction.any,
    defaultValue: currentDir,
    uncommon: true
  };
};

export const basedir = (binDir: string): ClOption => {
  return {
    name: 'basedir',
    type: String,
    description: 'The base directory of the bedrock program',
    validate: Extraction.any,
    defaultValue: path.join(binDir, '/..'),
    uncommon: true
  };
};

export const debuggingPort: ClOption = {
  name: 'debuggingPort',
  type: Number,
  description: 'The port for remote debugging (used for phantom and headless browsers)',
  validate: Extraction.any,
  uncommon: true
};

export const bucket: ClOption = {
  name: 'bucket',
  type: Number,
  description: 'Which "bucket" of tests to run, if you split the test runs with "buckets" setting. 1-based.',
  validate: Extraction.positiveInteger,
  defaultValue: 1,
  uncommon: true
};

export const buckets: ClOption = {
  name: 'buckets',
  type: Number,
  description: 'Number of "buckets" to split tests into. You can specify which bucket number to run, using the "bucket" setting. Useful for parallelizing tests over multiple build nodes.',
  validate: Extraction.positiveInteger,
  defaultValue: 1,
  uncommon: true
};

export const overallTimeout: ClOption = {
  name: 'totalTimeout',
  type: Number,
  output: 'overallTimeout',
  description: 'The total amount of time in milliseconds the test can take before bedrock times out.',
  validate: Extraction.any,
  defaultValue: 10 * 60 * 1000,
  uncommon: true
};

export const singleTimeout: ClOption = {
  name: 'singleTimeout',
  type: Number,
  description: 'The total amount of time in milliseconds a single test can take before bedrock times out.',
  validate: Extraction.any,
  defaultValue: 30 * 1000,
  uncommon: true
};

export const help: ClOption = {
  name: 'help',
  alias: 'h',
  type: Boolean,
  defaultValue: false,
  description: 'Print out the help information for command',
  validate: Extraction.any
};

export const logging: ClOption = {
  name: 'loglevel',
  type: String,
  defaultValue: 'advanced',
  description: 'The level of logging for test progress',
  validate: Extraction.inSet(['simple', 'advanced']),
  required: true
};

export const version: ClOption = {
  name: 'version',
  type: Boolean,
  defaultValue: false,
  description: 'Output the version number of the command',
  validate: Extraction.any
};

export const chunk: ClOption = {
  name: 'chunk',
  type: Number,
  description: 'Run tests in groups of this size, reload page between.',
  validate: Extraction.any,
  defaultValue: 100,
  uncommon: true
};

export const retries: ClOption = {
  name: 'retries',
  type: Number,
  description: 'Retry failing tests this many times. Ignored with stopOnFailure.',
  validate: Extraction.any,
  defaultValue: 0
};

export const stopOnFailure: ClOption = {
  name: 'stopOnFailure',
  type: Boolean,
  defaultValue: false,
  description: 'Stop after the first failure',
  validate: Extraction.any
};

export const wipeBrowserCache: ClOption = {
  name: 'wipeBrowserCache',
  type: Boolean,
  defaultValue: false,
  description: 'Wipe the browsers cache when starting the webdriver session (IE only)',
  validate: Extraction.any
};

export const customRoutes: ClOption = {
  name: 'customRoutes',
  type: String,
  description: 'File with custom static routes',
  validate: Extraction.file,
  uncommon: true
};

export const delayExiting: ClOption = {
  name: 'delayExit',
  type: Boolean,
  defaultValue: false,
  description: 'After the tests have completed, delay quitting the server',
  validate: Extraction.any
};

export const useSandboxForHeadless: ClOption = {
  name: 'useSandboxForHeadless',
  type: Boolean,
  defaultValue: false,
  description: 'Pass --no-sandbox through to chrome headless options',
  validate: Extraction.any,
  uncommon: true
};

/*
 * In several situations, we need to pass through specific options to the
 * browser's being launched. For example, Chrome Headless uses quite a lot
 * of /dev/shm which can be a problem when running in docker containers,
 * as the default of docker containers is just 64MB. The solution that
 * Google tends to offer is to disable /dev/shm usage altogether through a
 * chrome flag (https://developers.google.com/web/tools/puppeteer/troubleshooting#tips)
 */
export const extraBrowserCapabilities: ClOption = {
  name: 'extraBrowserCapabilities',
  type: String,
  defaultValue: '',
  description: 'Pass additional capabilities to the browser (e.g. " --disable-dev-shm-usage" for Chrome). Note, you must surround the value in quotes, and have a leading space if the capabilities contain hyphens, otherwise, bedrock\'s command line parser will throw errors.',
  validate: Extraction.any,
  uncommon: true
};

export const coverage: ClOption = {
  name: 'coverage',
  output: 'coverage',
  type: String,
  description: 'Path to generate code coverage on',
  uncommon: true,
  multiple: true,
  flatten: true,
  validate: Extraction.directory
};

export const skipResetMousePosition: ClOption = {
  name: 'skipResetMousePosition',
  type: Boolean,
  defaultValue: false,
  description: 'Prevent bedrock from resetting the mouse position to the top left corner of the screen between tests',
  validate: Extraction.any,
  uncommon: true
};

export const polyfills: ClOption = {
  name: 'polyfills',
  type: String,
  multiple: true,
  defaultValue: [ 'Symbol' ],
  description: 'CoreJS polyfills to apply when running tests',
  validate: Extraction.inSet([ 'ArrayBuffer', 'Map', 'Object', 'Promise', 'Set', 'Symbol', 'TypedArray', 'WeakMap', 'WeakSet' ]),
  uncommon: true
};

export const verbose: ClOption = {
  name: 'verbose',
  type: Boolean,
  defaultValue: false,
  description: 'Enable verbose logging mode',
  validate: Extraction.any,
  uncommon: false
};
