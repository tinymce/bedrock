import { Failure, LoggedError, RunnableState, Suite, Test } from '@ephox/bedrock-common';
import Promise from '@ephox/wrap-promise-polyfill';
import * as Context from '../core/Context';
import { InternalError, isInternalError, SkipError } from '../errors/Errors';
import { Reporter, TestReporter } from '../reporter/Reporter';
import * as Hooks from './Hooks';
import { runWithErrorCatcher, runWithTimeout } from './Run';
import { countTests, loop } from './Utils';

type LoggedError = LoggedError.LoggedError;
type RunReporter = Pick<Reporter, 'test'>;

export interface RunState {
  readonly totalTests: number;
  readonly offset: number;
  readonly chunk: number;
  readonly timeout: number;
  testCount: number;
}

export interface RunActions {
  readonly onFailure: () => void;
  readonly onPass: () => void;
  readonly onSkip: () => void;
  readonly onStart: (test: Test) => void;
  readonly runNextChunk: (offset: number) => void;
}

const runTestWithRetry = (test: Test, state: RunState, report: TestReporter, retryCount: number): Promise<void> => {
  if (test.isSkipped()) {
    return Promise.reject(new SkipError());
  } else {
    const runAfterHooks = <T>(error: boolean) => (result: T): Promise<T> =>
      Hooks.runAfterEach(test).then(() => error ? Promise.reject(result) : Promise.resolve(result));

    return Hooks.runBeforeEach(test)
      .then(() => runWithErrorCatcher(test, () => runWithTimeout(test, Context.createContext(test, test), state.timeout)))
      // Ensure we run the afterEach hooks no matter if the test failed
      .then(runAfterHooks(false), runAfterHooks(true))
      .catch((e: LoggedError | InternalError) => {
        if (retryCount < test.retries() && !isInternalError(e)) {
          test.setResult(RunnableState.NotRun);
          return report.retry().then(() => runTestWithRetry(test, state, report, retryCount + 1));
        } else {
          return Promise.reject(e);
        }
      });
  }
};

export const runTest = (test: Test, state: RunState, actions: RunActions, reporter: RunReporter): Promise<void> => {
  const fail = (report: TestReporter, e: LoggedError) => {
    test.setResult(RunnableState.Failed, e);
    console.error(e);
    return report.fail(e).then(actions.onFailure).then(() => Promise.reject());
  };

  const skip = (report: TestReporter) => {
    test.setResult(RunnableState.Skipped);
    return report.skip(test.title).then(actions.onSkip);
  };

  const pass = (report: TestReporter) => {
    test.setResult(RunnableState.Passed);
    return report.pass().then(actions.onPass);
  };

  state.testCount++;
  if (state.testCount <= state.offset) {
    return Promise.resolve();
  } else if (state.testCount > state.offset + state.chunk) {
    actions.runNextChunk(state.offset + state.chunk);
    // Reject so no other tests are run
    return Promise.reject();
  } else {
    const report = reporter.test(test.file || 'Unknown', test.fullTitle(), state.totalTests);

    actions.onStart(test);
    return report.start()
      .then(() => runTestWithRetry(test, state, report, 0))
      .then(() => pass(report), (e: LoggedError | InternalError) => {
        if (e instanceof SkipError) {
          return skip(report);
        } else {
          return fail(report, Failure.prepFailure(e));
        }
      });
  }
};

export const runTests = (tests: Test[], state: RunState, actions: RunActions, reporter: RunReporter): Promise<void> => {
  return loop(tests, (test) => runTest(test, state, actions, reporter));
};

export const runSuite = (suite: Suite, state: RunState, actions: RunActions, reporter: RunReporter): Promise<void> => {
  const numTests = countTests(suite);
  if (state.testCount + numTests <= state.offset) {
    state.testCount += numTests;
    return Promise.resolve();
  } else {
    const runAfterHooks = <T>(error: boolean) => (result: T): Promise<T> =>
      Hooks.runAfter(suite).then(() => error ? Promise.reject(result) : Promise.resolve(result));

    return Hooks.runBefore(suite)
      .then(() => runTests(suite.tests, state, actions, reporter))
      .then(() => runSuites(suite.suites, state, actions, reporter))
      // Ensure we run the after hooks no matter if the tests/suites fail
      .then(runAfterHooks(false), runAfterHooks(true));
  }
};

export const runSuites = (suites: Suite[], state: RunState, actions: RunActions, reporter: RunReporter): Promise<void> => {
  return loop(suites, (suite) => runSuite(suite, state, actions, reporter));
};