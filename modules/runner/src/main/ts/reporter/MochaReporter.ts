import { LoggedError } from '@ephox/bedrock-common';
import { MochaOptions, Runner as MochaRunner, Test } from 'mocha';
import { ResourceLocker } from '../core/ResourceLocker';
import { noop } from '../core/Utils';
import { Reporter, TestReporter } from './Reporter';

type LoggedError = LoggedError.LoggedError;

export interface MochaReporterOptions {
  readonly numTests: number;
  readonly onPass: () => void;
  readonly onSkip: () => void;
  readonly onFailure: (err: LoggedError) => void;
}

const defaultOptions: MochaReporterOptions = {
  numTests: 0,
  onPass: noop,
  onSkip: noop,
  onFailure: noop
};

export const create = (reporter: Reporter) => {
  return (runner: MochaRunner, options: MochaOptions): void => {
    const opts: MochaReporterOptions = options.reporterOptions || defaultOptions;
    const locker = ResourceLocker();
    let currentTest: Test;
    let report: TestReporter;
    let lastError: LoggedError | undefined;

    // Setup root hooks, as for the reporter we need the start/pass/fail to be async meaning we can't use events
    mocha.rootHooks({
      beforeEach(done) {
        locker.async((unlock) => {
          report.start(unlock);
        }, done);
      },
      afterEach(done) {
        const test = this.currentTest;

        locker.async((unlock) => {
          if (!test || test.isFailed()) {
            // We're guaranteed to have an error if the state is a failure
            const error = lastError as LoggedError;
            report.fail(error, () => {
              opts.onFailure(error);
              unlock();
            });
          } else if (test.isPending()) {
            report.skip(test.title, () => {
              opts.onSkip();
              unlock();
            });
          } else {
            report.pass(() => {
              opts.onPass();
              unlock();
            });
          }
        }, done);
      }
    });

    const onTestStart = (test: Test) => {
      currentTest = test;
      const testTitle = test.titlePath().slice(0, -1).join(' / ') + ' ' + test.title;
      report = reporter.test(test.file || 'Unknown', testTitle, opts.numTests);
    };

    // Setup the various runner events to report on
    runner.on('test', (test) => {
      locker.sync(() => onTestStart(test));
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
      if (currentTest !== test) {
        locker.async((unlock) => {
          onTestStart(test);
          report.start(() => {
            report.skip(test.title, () => {
              opts.onSkip();
              unlock();
            });
          });
        });
      }
    });

    runner.on('end', () => {
      locker.sync(reporter.done);
    });
  };
};