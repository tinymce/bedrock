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

describe('cli', () => {
  it('Minimal specification of bedrock-auto', () => {
    const args = [
      "--browser", "MicrosoftEdge",
      "--files", "src/test/resources/test.file1",
      "--config", "src/test/resources/tsconfig.sample.json"
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
      debuggingPort: 9000,
      delayExit: false,
      singleTimeout: 30000,
      stopOnFailure: false,
      overallTimeout: 600000,
      loglevel: 'advanced',
      version: false,
      chunk: 100,
      retries: 0,
      useSandboxForHeadless: false,
      skipResetMousePosition: false,
      wipeBrowserCache: false
    }, cleanResult(actual));
  });

  it('Specification of bedrock-auto missing required field: browser', () => {
    const args = [
      "--files", "src/test/resources/test.file1",
      "--config", "src/test/resources/tsconfig.sample.json"
    ];
    const actual = Clis.forAuto(directories, args);
    AttemptUtils.assertErrors([
      'The *required* output property [browser] from [browser] must be specified'
    ], cleanError(actual));
  });

  it('Minimal specification of bedrock-manual', () => {
    const args = [
      "--files", "src/test/resources/test.file1",
      "--config", "src/test/resources/tsconfig.sample.json"
    ];
    const actual = Clis.forManual(directories, args);
    AttemptUtils.assertResult( {
      config: 'src/test/resources/tsconfig.sample.json',
      testfiles: [
        'src/test/resources/test.file1'
      ],
      help: false,
      bundler: 'webpack',
      singleTimeout: 30000,
      stopOnFailure: false,
      overallTimeout: 600000,
      loglevel: 'advanced',
      version: false,
      chunk: 100
    }, Attempt.map(actual, exclude(['projectdir', 'basedir'])));
  });
});
