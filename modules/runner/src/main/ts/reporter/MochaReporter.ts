import { LoggedError } from '@ephox/bedrock-common';
import Promise from '@ephox/wrap-promise-polyfill';
import { Context, MochaOptions, Runner as MochaRunner, Test } from 'mocha';
import { Lock } from '../core/Lock';
import { noop } from '../core/Utils';
import { Reporter, TestReporter } from './Reporter';

type LoggedError = LoggedError.LoggedError;

export interface MochaReporterOptions {
  readonly reporter: Reporter;
  readonly numTests: number;
  readonly onPass: () => void;
  readonly onSkip: () => void;
  readonly onFailure: (err: LoggedError) => void;
}

const defaultOptions: Partial<MochaReporterOptions> = {
  onPass: noop,
  onSkip: noop,
  onFailure: noop
};

const isTestEqual = (test1?: Test, test2?: Test) => {
  if (test1 === undefined || test2 === undefined) {
    return false;
  } else {
    return test1.parent === test2.parent
      && test1.ctx === test2.ctx
      && test1.file === test2.file
      && test1.title === test2.title;
  }
};

export class BedrockMochaReporter extends Mocha.reporters.Base {
  constructor(runner: MochaRunner, options: MochaOptions) {
    super(runner, options);

    const opts: MochaReporterOptions = {
      ...defaultOptions,
      ...options.reporterOptions
    };
    const reporter = opts.reporter;

    const lock = Lock();
    let currentTest: Test | undefined;
    let lastError: LoggedError | undefined;
    let report: TestReporter;
    let aborted = false;

    const processResult = (test?: Test): Promise<void> => {
      if (!test || test.isFailed()) {
        // We're guaranteed to have an error if the state is a failure
        const error = lastError as LoggedError;
        return report.fail(error).then(() => opts.onFailure(error));
      } else if (test.isPending()) {
        return report.skip(test.title).then(opts.onSkip);
      } else if (test.isPassed()) {
        return report.pass().then(opts.onPass);
      } else {
        return Promise.resolve();
      }
    };

    // Setup root hooks, as for the reporter we need the start/pass/fail to be async meaning we can't use events
    mocha.rootHooks({
      beforeEach() {
        return lock.execute(() => report.start());
      },
      afterEach(this: Context) {
        const test = this.currentTest;
        return lock.execute(() => processResult(test));
      }
    });

    const onTestStart = (test: Test) => {
      if (!isTestEqual(currentTest, test)) {
        currentTest = test;
        const testTitle = test.titlePath().slice(0, -1).join(' / ') + ' ' + test.title;
        report = reporter.test(test.file || 'Unknown', testTitle, opts.numTests);
      }
    };

    // Setup the various runner events to report on
    runner.on('test', (test) => {
      lock.execute(() => onTestStart(test));
    });

    // Listen to the failure event so that we can get the error
    runner.on('fail', (e, err) => {
      lastError = err;
      console.error(err);
    });

    // Listen to the pending event to fire. Skipped/pending tests depending on how they are called,
    // don't run hooks so we can't update the reporter via the normal mechanisms.
    runner.on('pending', (test) => {
      // If the current test isn't the skipped test, then it means the test was immediately skipped
      // and hooks won't be run, so we need to lock and report the skipped test
      if (!isTestEqual(currentTest, test)) {
        lock.execute(() => {
          onTestStart(test);
          return report.start().then(() => processResult(test));
        });
      }
    });

    runner.on('end', () => {
      if (!aborted) {
        lock.execute(reporter.done);
      }
    });

    runner.on('abort', () => {
      aborted = true;
    });
  }

  public epilogue(): void {
    // Do nothing
  }
}