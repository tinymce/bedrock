import { HarnessResponse } from '../core/ServerTypes';
import { RootSuite } from '../core/TestTypes';
import { UrlParams } from '../core/UrlParams';
import { noop } from '../core/Utils';
import { Callbacks } from '../reporter/Callbacks';
import { Reporter } from '../reporter/Reporter';
import { Actions } from '../ui/Actions';
import { Ui } from '../ui/Ui';
import * as Run from './Run';
import { countTests, loop } from './Utils';

export interface Runner {
  readonly init: (onSuccess: (data: HarnessResponse) => void, onError: (e: any) => void) => void;
  readonly run: (chunk: number, retries: number, timeout: number, stopOnFailure: boolean) => void;
}

export interface Runner {
  readonly init: (onSuccess: (data: HarnessResponse) => void, onError: (e: any) => void) => void;
  readonly run: (chunk: number, retries: number, timeout: number, stopOnFailure: boolean) => void;
}

// 5sec interval for the server to know the client hasn't disconnected
// Note: The interval needs to be less than 10secs, otherwise the server will disconnect.
//       See `Controller.ts` in the server.
const KEEP_ALIVE_INTERVAL = 5000;

export const Runner = (rootSuites: RootSuite[], params: UrlParams, callbacks: Callbacks, reporter: Reporter, ui: Ui): Runner => {
  const actions = Actions(params.session);
  const totalNumTests = rootSuites.reduce((acc, suite) => acc + countTests(suite), 0);

  const withSum = (action: (offset: number, failed: number, retry?: number) => void, offset = 0, failedOffset = 0) => (retry?: number) => {
    const sum = reporter.summary();
    action(sum.offset + offset, sum.failed + failedOffset, retry);
  };

  const runNextChunk = (offset: number) => {
    actions.reloadPage(offset, reporter.summary().failed);
  };

  const retryTest = withSum(actions.retryTest);
  const loadNextTest = withSum(actions.skipTest);
  const stopTest = withSum(actions.updateHistory, 0, -1);

  const onTestPass = () => {
    if (params.retry > 0) {
      params.retry = 0;
      actions.updateHistory(params.offset, params.retry);
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

  const init = (onSuccess: (data: HarnessResponse) => void, onError: (e: any) => void) => {
    // Render the initial UI
    ui.render(params.offset, totalNumTests, actions.restartTests, retryTest, loadNextTest);

    // delay this ajax call until after the reporter status elements are in the page
    $((): void => {
      const keepAliveTimer = setInterval(() => {
        callbacks.sendKeepAlive(params.session, noop, () => {
          // if the server shuts down stop trying to send messages
          clearInterval(keepAliveTimer);
        });
      }, KEEP_ALIVE_INTERVAL);

      $.ajax({
        url: 'harness',
        dataType: 'json',
        success: onSuccess,
        error: onError,
      });
    });
  };

  const run = (chunk: number, retries: number, timeout: number, stopOnFailure: boolean): void => {
    const runState: Run.State = {
      totalTests: totalNumTests,
      offset: params.offset,
      chunk,
      timeout,
      testCount: 0
    };

    const runActions: Run.Actions = {
      onFailure: () => onTestFailure(retries, stopOnFailure),
      onPass: onTestPass,
      runNextChunk
    };

    ui.setStopOnFailure(stopOnFailure);
    loop(rootSuites, (suite, next) => {
      Run.runSuite(suite, suite.filePath, runState, runActions, reporter, next);
    }, () => {
      reporter.done();
      // for easy rerun reset the URL
      actions.updateHistory(0, 0);
    });
  };

  return {
    init,
    run
  };
};