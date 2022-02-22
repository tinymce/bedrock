import { Suite } from '@ephox/bedrock-common';
import Promise from '@ephox/wrap-promise-polyfill';
import { HarnessResponse } from '../core/ServerTypes';
import { UrlParams } from '../core/UrlParams';
import { noop } from '../core/Utils';
import { Callbacks } from '../reporter/Callbacks';
import { Reporter } from '../reporter/Reporter';
import { Actions } from '../ui/Actions';
import { Ui } from '../ui/Ui';
import { RunActions, RunState, runSuite } from './TestRun';
import { countTests, filterOnly } from './Utils';

export interface Runner {
  readonly init: () => Promise<HarnessResponse>;
  readonly run: (chunk: number, retries: number, timeout: number, stopOnFailure: boolean) => Promise<void>;
}

// 5sec interval for the server to know the client hasn't disconnected
// Note: The interval needs to be less than 10secs, otherwise the server will disconnect.
//       See `Controller.ts` in the server.
const KEEP_ALIVE_INTERVAL = 5000;

export const Runner = (rootSuite: Suite, params: UrlParams, callbacks: Callbacks, reporter: Reporter, ui: Ui): Runner => {
  const actions = Actions(params.session);
  let numTests = 0;

  const withSum = (action: (offset: number, failed: number, skipped: number, retry?: number) => void, offset = 0, failedOffset = 0, skippedOffset = 0) => (retry?: number) => {
    const sum = reporter.summary();
    action(sum.offset + offset, sum.failed + failedOffset, sum.skipped + skippedOffset, retry);
  };

  const runNextChunk = (offset: number) => {
    const sum = reporter.summary();
    actions.reloadPage(offset, sum.failed, sum.skipped);
  };

  const retryTest = withSum(actions.retryTest);
  const loadNextTest = withSum(actions.nextTest);
  const stopTest = withSum(actions.updateHistory, 0, -1);

  const onTestPass = () => {
    const sum = reporter.summary();
    if (params.retry > 0) {
      params.retry = 0;
      actions.updateHistory(params.offset, sum.failed, sum.skipped, params.retry);
    }
  };

  const onTestFailure = (retries: number, stopOnFailure: boolean): void => {
    if (stopOnFailure) {
      reporter.done();
      // make it easy to restart at this test
      stopTest();
    } else if (params.retry < retries) {
      retryTest(params.retry + 1);
    } else {
      loadNextTest();
    }
  };

  const init = (): Promise<HarnessResponse> => {
    // Filter the tests to ensure we have an accurate total test count
    filterOnly(rootSuite);
    numTests = countTests(rootSuite);

    // Render the initial UI
    ui.render(params.offset, numTests, actions.restartTests, retryTest, loadNextTest);

    // delay this ajax call until after the reporter status elements are in the page
    const keepAliveTimer = setInterval(() => {
      callbacks.sendKeepAlive(params.session).catch(() => {
        // if the server shuts down stop trying to send messages
        clearInterval(keepAliveTimer);
      });
    }, KEEP_ALIVE_INTERVAL);

    return callbacks.sendInit(params.session).then(() => callbacks.loadHarness());
  };

  const run = (chunk: number, retries: number, timeout: number, stopOnFailure: boolean): Promise<void> => {
    const runState: RunState = {
      totalTests: numTests,
      offset: params.offset,
      chunk,
      timeout,
      testCount: 0
    };

    const runActions: RunActions = {
      onFailure: () => onTestFailure(retries, stopOnFailure),
      onPass: onTestPass,
      onSkip: onTestPass,
      onStart: noop,
      runNextChunk
    };

    ui.setStopOnFailure(stopOnFailure);
    return runSuite(rootSuite, runState, runActions, reporter)
      .then(() => {
        reporter.done();
        // for easy rerun reset the URL
        actions.updateHistory(0, 0, 0);
      }, (e) => {
        // An error handled by the test runner won't return an error object and will just reject.
        // So if we have an error, it means an unexpected/unhandled error occurred in the promise
        // chain. If we have no error then the runner has finished due to a test failure.
        if (e !== undefined) {
          return Promise.reject(e);
        } else {
          return Promise.resolve();
        }
      });
  };

  return {
    init,
    run
  };
};