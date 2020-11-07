import { Hook, LoggedError, Tests } from '@ephox/bedrock-common';
import { Reporter, TestReporter } from '../reporter/Reporter';
import { runHooks } from './Hooks';
import { countTests, loop } from './Utils';

type LoggedError = LoggedError.LoggedError;

type RunReporter = Pick<Reporter, 'test'>;

export interface State {
  readonly totalTests: number;
  readonly offset: number;
  readonly chunk: number;
  readonly timeout: number;
  testCount: number;
}

export interface Actions {
  readonly onFailure: () => void;
  readonly onPass: () => void;
  readonly runNextChunk: (offset: number) => void;
}

export const runTest = (test: Tests.Test, filePath: string, state: State, actions: Actions, reporter: RunReporter, done: () => void): void => {
  let timedOut = false;
  const fail = (report: TestReporter, e: LoggedError) => {
    console.error(e.error || e);
    report.fail(e, actions.onFailure);
  };

  state.testCount++;
  if (state.testCount <= state.offset) {
    done();
  } else if (state.testCount > state.offset + state.chunk) {
    actions.runNextChunk(state.offset + state.chunk);
  } else {
    const report = reporter.test(filePath, test.name, state.totalTests);
    const timer = setTimeout(() => {
      timedOut = true;
      fail(report, { error: new Error('Test ran too long'), logs: [] });
    }, state.timeout);

    const error = (e: LoggedError) => {
      clearTimeout(timer);
      fail(report, e);
    };

    try {
      report.start(() => {
        runHooks(test.suite, Hook.BeforeEach, true, () => {
          test.test(() => {
            runHooks(test.suite, Hook.AfterEach, true,() => {
              clearTimeout(timer);
              if (!timedOut) {
                report.pass(() => {
                  actions.onPass();
                  done();
                });
              }
            }, error);
          }, error);
        }, error);
      });
    } catch (e) {
      error(e);
    }
  }
};

export const runTests = (tests: Tests.Test[], filePath: string, state: State, actions: Actions, reporter: RunReporter, done: () => void): void => {
  loop(tests, (test, next) => {
    runTest(test, filePath, state, actions, reporter, next);
  }, done);
};

export const runSuite = (suite: Tests.Suite, filePath: string, state: State, actions: Actions, reporter: RunReporter, done: () => void): void => {
  const numTests = countTests(suite);
  if (state.testCount + numTests < state.offset) {
    state.testCount += numTests;
    done();
  } else {
    // TODO: Report hook failures in the UI
    const error = (e: LoggedError) => {
      console.error(e.error || e);
    };

    runHooks(suite, Hook.Before, false, () => {
      runTests(suite.tests, filePath, state, actions, reporter, () => {
        runSuites(suite.suites, filePath, state, actions, reporter, () => {
          runHooks(suite, Hook.After, false, done, error);
        });
      });
    }, error);
  }
};

export const runSuites = (suites: Tests.Suite[], filePath: string, state: State, actions: Actions, reporter: RunReporter, done: () => void): void => {
  loop(suites, (suite, next) => {
    runSuite(suite, filePath, state, actions, reporter, next);
  }, done);
};