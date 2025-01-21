import { Failure, LoggedError, RunnableState, Suite, Test } from '@ephox/bedrock-common';
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
  readonly checkSiblings: () => string[];
  readonly auto: boolean;
}

export interface RunActions {
  readonly onFailure: () => void;
  readonly onPass: () => void;
  readonly onSkip: () => void;
  readonly onStart: (test: Test) => void;
  readonly runNextChunk: (offset: number) => void;
}

const runTestWithRetry = (test: Test, state: RunState, testReport: TestReporter, retryCount: number): Promise<void> => {
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
        // This is unique to `this.retries()` within a test, not the general page reload to retry system
        if (retryCount < test.retries() && !isInternalError(e)) {
          test.setResult(RunnableState.NotRun);
          testReport.retry();
          // don't fail the page
          return runTestWithRetry(test, state, testReport, retryCount + 1);
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
    report.fail(e);
    // this is where the page reloads if the global retry system is active
    actions.onFailure();
    // Test failures must be an empty reject, otherwise the error management thinks it's a bedrock error
    return Promise.reject();
  };

  const skip = (testReport: TestReporter) => {
    test.setResult(RunnableState.Skipped);
    testReport.skip(test.title);
    actions.onSkip();
  };

  const pass = async (testReport: TestReporter) => {
    test.setResult(RunnableState.Passed);
    testReport.pass();
    actions.onPass();
  };

  state.testCount++;
  if (state.testCount <= state.offset) {
    return Promise.resolve();
  } else if (state.testCount > state.offset + state.chunk) {
    actions.runNextChunk(state.offset + state.chunk);
    // Reject so no other tests are run
    // Test failures must be an empty reject, otherwise the error management thinks it's a bedrock error
    return Promise.reject();
  } else {
    const testReport = reporter.test(test.file || 'Unknown', test.fullTitle(), state.totalTests);

    actions.onStart(test);
    if (!state.auto) {
      console.log(`Starting test ${state.testCount} of ${state.totalTests}: ${test.fullTitle()} (${test.file})`);
    }
    testReport.start();
    return runTestWithRetry(test, state, testReport, 0)
      .then(() => pass(testReport), (e: LoggedError | InternalError) => {
        if (e instanceof SkipError) {
          return skip(testReport);
        } else {
          return fail(testReport, Failure.prepFailure(e));
        }
      });
  }
};

export const runTests = (tests: Test[], state: RunState, actions: RunActions, reporter: RunReporter): Promise<void> => {
  return loop(tests, (test) => runTest(test, state, actions, reporter));
};

const fakeFailure = (reporter: RunReporter, suite: Suite, state: RunState, siblings: string[], actions: RunActions) => {
  const tests = suite.tests.length === 0 ? suite.suites[0].tests : suite.tests;
  const filename = tests[0]?.file || 'Unknown';
  const fakeReporter = reporter.test(filename.substring(filename.lastIndexOf('/') + 1) + ' DOM validation', suite.fullTitle(), state.totalTests);
  fakeReporter.start();
  const fakeFailure = LoggedError.loggedError(new Error(`File ${filename} did not clean up after itself, extra elements were left in the DOM`), siblings);

  // This is mostly duplicate of `fakeReporter.fail()`, but the "test" doesn't really exist
  // so the UI gets confused and shows two errors if we do that
  console.error(fakeFailure);
  fakeReporter.fail(fakeFailure);
  // this is where the page reloads if the global retry system is active
  actions.onFailure();
  // Test failures must be an empty reject, otherwise the error management thinks it's a bedrock error
  return Promise.reject();
};

export const runSuite = (suite: Suite, state: RunState, actions: RunActions, reporter: RunReporter): Promise<void> => {
  const numTests = countTests(suite);
  if (state.testCount + numTests <= state.offset) {
    state.testCount += numTests;
    return Promise.resolve();
  } else {
    const runAfterHooks = <T>(error: boolean) => (result: T): Promise<T> =>
      Hooks.runAfter(suite).then(() => error ? Promise.reject(result) : Promise.resolve(result));

    const checkSiblings = !suite.root ? undefined :
      () => {
        const siblings = state.checkSiblings();
        if (siblings.length > 0) {
          return fakeFailure(reporter, suite, state, siblings, actions);
        }
      };

    return Hooks.runBefore(suite)
      .then(() => runTests(suite.tests, state, actions, reporter))
      .then(() => runSuites(suite.suites, state, actions, reporter))
      .then(checkSiblings)
      // Ensure we run the after hooks no matter if the tests/suites fail
      .then(runAfterHooks(false), runAfterHooks(true));
  }
};

export const runSuites = (suites: Suite[], state: RunState, actions: RunActions, reporter: RunReporter): Promise<void> => {
  return loop(suites, (suite) => {

    const checkSiblings = !suite.parent?.root ? undefined :
      () => {
        const siblings = state.checkSiblings();
        if (siblings.length > 0) {
          return fakeFailure(reporter, suite, state, siblings, actions);
        }
      };
    return runSuite(suite, state, actions, reporter).then(checkSiblings);
  });
};
