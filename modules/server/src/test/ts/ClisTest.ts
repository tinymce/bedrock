import { describe, it } from 'mocha';
import * as Clis from '../../main/ts/bedrock/cli/Clis';
import * as AttemptUtils from './AttemptUtils';
import { Attempt } from '../../main/ts/bedrock/core/Attempt';
import { CliError } from '../../main/ts/bedrock/cli/Cli';

const directories = {
  current: process.cwd(),
  bin: __dirname
};

const exclude = (fields: any) => (obj: any) => {
  const r: any = {};
  for (const k in obj) {
    if (obj.hasOwnProperty(k)) {
      if (fields.indexOf(k) === -1) r[k] = obj[k];
    }
  }
  return r;
};

const cleanError = <T>(result: Attempt<CliError, T>) =>
  Attempt.cata(result, (err) => Attempt.failed(err.errors), Attempt.passed);

const cleanResult = <T>(result: Attempt<CliError, T>) =>
  Attempt.cata(result, Attempt.failed, (v) =>
    Attempt.passed(exclude(['projectdir', 'basedir'])(v)));

describe('Clis.forAuto', () => {
  it('parses minimal specification', () => {
    const args = [
      '--browser', 'MicrosoftEdge',
      '--files', 'src/test/resources/test.file1',
      '--config', 'src/test/resources/tsconfig.sample.json'
    ];
    const actual = Clis.forAuto(directories, args);
    AttemptUtils.assertResult({
      browser: 'MicrosoftEdge',
      bundler: 'webpack',
      config: 'src/test/resources/tsconfig.sample.json',
      name: 'bedrock-run',
      output: 'scratch',
      help: false,
      testfiles: [
        'src/test/resources/test.file1'
      ],
      delayExit: false,
      singleTimeout: 30000,
      stopOnFailure: false,
      overallTimeout: 600000,
      loglevel: 'advanced',
      version: false,
      chunk: 100,
      retries: 0,
      polyfills: [ 'Symbol' ],
      verbose: false,
      bucket: 1,
      buckets: 1,
      useSandboxForHeadless: false,
      extraBrowserCapabilities: '',
      skipResetMousePosition: false,
      wipeBrowserCache: false
    }, cleanResult(actual));
  });

  it('parses verbose logging mode', () => {
    const args = [
      '--browser', 'MicrosoftEdge',
      '--files', 'src/test/resources/test.file1',
      '--config', 'src/test/resources/tsconfig.sample.json',
      '--verbose'
    ];
    const actual = Clis.forAuto(directories, args);
    AttemptUtils.assertResult({
      browser: 'MicrosoftEdge',
      bundler: 'webpack',
      config: 'src/test/resources/tsconfig.sample.json',
      name: 'bedrock-run',
      output: 'scratch',
      help: false,
      testfiles: [
        'src/test/resources/test.file1'
      ],
      delayExit: false,
      singleTimeout: 30000,
      stopOnFailure: false,
      overallTimeout: 600000,
      loglevel: 'advanced',
      version: false,
      chunk: 100,
      retries: 0,
      polyfills: [ 'Symbol' ],
      verbose: true,
      bucket: 1,
      buckets: 1,
      useSandboxForHeadless: false,
      extraBrowserCapabilities: '',
      skipResetMousePosition: false,
      wipeBrowserCache: false
    }, cleanResult(actual));
  });

  it('parses bucket arguments', () => {
    const args = [
      '--browser', 'MicrosoftEdge',
      '--files', 'src/test/resources/test.file1',
      '--config', 'src/test/resources/tsconfig.sample.json',
      '--bucket', '3',
      '--buckets', '7'
    ];
    const actual = Clis.forAuto(directories, args);
    AttemptUtils.assertResult({
      browser: 'MicrosoftEdge',
      bundler: 'webpack',
      config: 'src/test/resources/tsconfig.sample.json',
      name: 'bedrock-run',
      output: 'scratch',
      help: false,
      testfiles: [
        'src/test/resources/test.file1'
      ],
      delayExit: false,
      singleTimeout: 30000,
      stopOnFailure: false,
      overallTimeout: 600000,
      loglevel: 'advanced',
      version: false,
      chunk: 100,
      retries: 0,
      polyfills: [ 'Symbol' ],
      verbose: false,
      bucket: 3,
      buckets: 7,
      useSandboxForHeadless: false,
      extraBrowserCapabilities: '',
      skipResetMousePosition: false,
      wipeBrowserCache: false
    }, cleanResult(actual));
  });

  it('parses extra browser capabilities arguments with a leading space', () => {
    const args = [
      '--browser', 'chrome-headless',
      '--files', 'src/test/resources/test.file1',
      '--config', 'src/test/resources/tsconfig.sample.json',
      '--extraBrowserCapabilities', ' --some-browser-flag'
    ];
    const actual = Clis.forAuto(directories, args);
    AttemptUtils.assertResult({
      browser: 'chrome-headless',
      bundler: 'webpack',
      config: 'src/test/resources/tsconfig.sample.json',
      name: 'bedrock-run',
      output: 'scratch',
      help: false,
      testfiles: [
        'src/test/resources/test.file1'
      ],
      delayExit: false,
      singleTimeout: 30000,
      stopOnFailure: false,
      overallTimeout: 600000,
      loglevel: 'advanced',
      version: false,
      chunk: 100,
      retries: 0,
      polyfills: [ 'Symbol' ],
      verbose: false,
      bucket: 1,
      buckets: 1,
      useSandboxForHeadless: false,
      extraBrowserCapabilities: ' --some-browser-flag',
      skipResetMousePosition: false,
      wipeBrowserCache: false
    }, cleanResult(actual));
  });

  // This isn't so much of desired test outcome, just a reality. If we don't have
  // a leading space in the extraBrowserCapabilities, and the first value in the
  // string is --, then command-line-arguments (third party parser) will get confused
  // and throw errors.
  it('can not parse extra browser capabilities arguments without a leading space', () => {
    const args = [
      '--browser', 'MicrosoftEdge',
      '--files', 'src/test/resources/test.file1',
      '--config', 'src/test/resources/tsconfig.sample.json',
      '--bucket', '3',
      '--buckets', '7',
      '--extraBrowserCapabilities', '--this-is-going-to-fail'
    ];
    const actual = Clis.forAuto(directories, args);
    AttemptUtils.assertErrors([
      'Unknown option: --this-is-going-to-fail'
    ], cleanError(actual));
  });

  it('fails when browser argument missing', () => {
    const args = [
      '--files', 'src/test/resources/test.file1',
      '--config', 'src/test/resources/tsconfig.sample.json'
    ];
    const actual = Clis.forAuto(directories, args);
    AttemptUtils.assertErrors([
      'The *required* output property [browser] from [browser] must be specified'
    ], cleanError(actual));
  });
});

describe('Clis.forManual', () => {
  const defaultCliOptions = {
    config: 'tsconfig.json',
    testfiles: [],
    help: false,
    bundler: 'webpack',
    singleTimeout: 30000,
    stopOnFailure: false,
    overallTimeout: 600000,
    loglevel: 'advanced',
    version: false,
    chunk: 100,
    polyfills: [ 'Symbol' ],
    bucket: 1,
    buckets: 1
  };

  it('Minimal specification of bedrock-manual', () => {
    const args = [
      '--files', 'src/test/resources/test.file1',
      '--config', 'src/test/resources/tsconfig.sample.json'
    ];
    const actual = Clis.forManual(directories, args);
    AttemptUtils.assertResult({
      ...defaultCliOptions,
      config: 'src/test/resources/tsconfig.sample.json',
      verbose: false,
      testfiles: [
        'src/test/resources/test.file1'
      ]
    }, Attempt.map(actual, exclude(['projectdir', 'basedir'])));
  });

  it('allows custom routes to be used', () => {
    const args = [
      '--files', 'src/test/resources/test.file1',
      '--customRoutes', 'src/test/resources/routes.json'
    ];
    const actual = Clis.forManual(directories, args);
    AttemptUtils.assertResult({
      ...defaultCliOptions,
      testfiles: [
        'src/test/resources/test.file1'
      ],
      verbose: false,
      customRoutes: 'src/test/resources/routes.json'
    }, Attempt.map(actual, exclude(['projectdir', 'basedir'])));
  });

  it('parses verbose logging mode', () => {
    const args = [
      '--files', 'src/test/resources/test.file1',
      '--config', 'src/test/resources/tsconfig.sample.json',
      '--bucket', '4',
      '--buckets', '15',
      '--verbose'
    ];
    const actual = Clis.forManual(directories, args);
    AttemptUtils.assertResult({
      ...defaultCliOptions,
      config: 'src/test/resources/tsconfig.sample.json',
      testfiles: [
        'src/test/resources/test.file1'
      ],
      verbose: true,
      bucket: 4,
      buckets: 15
    }, Attempt.map(actual, exclude(['projectdir', 'basedir'])));
  });

  it('parses bucket arguments', () => {
    const args = [
      '--files', 'src/test/resources/test.file1',
      '--config', 'src/test/resources/tsconfig.sample.json',
      '--bucket', '4',
      '--buckets', '15'
    ];
    const actual = Clis.forManual(directories, args);
    AttemptUtils.assertResult({
      ...defaultCliOptions,
      config: 'src/test/resources/tsconfig.sample.json',
      testfiles: [
        'src/test/resources/test.file1'
      ],
      verbose: false,
      bucket: 4,
      buckets: 15
    }, Attempt.map(actual, exclude(['projectdir', 'basedir'])));
  });
});