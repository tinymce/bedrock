import { Callbacks } from '../reporter/Callbacks';
import { Reporter } from '../reporter/Reporter';
import { BedrockMochaReporter } from '../reporter/MochaReporter';
import { Actions } from '../ui/Actions';
import { Ui } from '../ui/Ui';
import { HarnessResponse } from '../core/ServerTypes';
import { UrlParams } from '../core/UrlParams';
import { getTests, filterOmittedTests } from './Utils';

export interface Runner {
  readonly init: () => Promise<HarnessResponse>;
  readonly run: (chunk: number, retries: number, timeout: number, stopOnFailure: boolean) => void;
}

// 5sec interval for the server to know the client hasn't disconnected
// Note: The interval needs to be less than 10secs, otherwise the server will disconnect.
//       See `Controller.ts` in the server.
const KEEP_ALIVE_INTERVAL = 5000;

export const Runner = (params: UrlParams, callbacks: Callbacks, reporter: Reporter, ui: Ui): Runner => {
  const actions = Actions(params.session);
  let numTests = 0;

  const withSum = (action: (offset: number, failed: number, skipped: number, retry?: number) => void, offset = 0, failedOffset = 0, skippedOffset = 0) => (retry?: number) => {
    const sum = reporter.summary();
    action(sum.offset + offset, sum.failed + failedOffset, sum.skipped + skippedOffset, retry);
  };

  const loadNextChunk = (chunk: number): void => {
    if (numTests > (params.offset + chunk)) {
      const sum = reporter.summary();
      actions.reloadPage(params.offset + chunk, sum.failed, sum.skipped);
    }
  };

  const retryTest = withSum(actions.retryTest);
  const loadNextTest = withSum(actions.nextTest);
  const stopTest = withSum(actions.updateHistory, 0, -1);

  const afterFail = (retries: number, stopOnFailure: boolean): void => {
    if (stopOnFailure) {
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
    const rootSuite = mocha.suite;
    if (rootSuite.hasOnly()) {
      rootSuite.filterOnly();
    }
    numTests = rootSuite.total();

    // Render the initial UI
    ui.render(params.offset, numTests, actions.restartTests, retryTest, loadNextTest);

    // Ensure only tests in the offset range run
    const allTests = getTests(rootSuite);
    allTests.slice(0, params.offset).forEach(filterOmittedTests);

    // delay this ajax call until after the reporter status elements are in the page
    const keepAliveTimer = setInterval(() => {
      callbacks.sendKeepAlive(params.session).catch(() => {
        // if the server shuts down stop trying to send messages
        clearInterval(keepAliveTimer);
      });
    }, KEEP_ALIVE_INTERVAL);

    return callbacks.loadHarness();
  };

  const run = (chunk: number, retries: number, timeout: number, stopOnFailure: boolean): void => {
    ui.setStopOnFailure(stopOnFailure);
    let count = 0;

    const finishedTest = () => {
      // Reload the page if we've hit the chunking limit
      if (count++ >= chunk) {
        runner.emit('abort');
        runner.abort();
        loadNextChunk(chunk);
      }
    };

    // Setup the custom bedrock reporter
    mocha.reporter(BedrockMochaReporter, {
      reporter,
      numTests,
      onFailure: () => afterFail(retries, stopOnFailure),
      onPass: finishedTest,
      onSkip: finishedTest
    });

    // Start running the tests
    // Note: The tests actually run in the next event loop
    const runner = mocha.run((failures) => {
      // for easy rerun reset the URL
      if (failures === 0) {
        actions.updateHistory(0, 0, 0);
      }
    });

    // Setup the bedrock settings for each suite
    runner.on('suite', (suite) => {
      suite.bail(stopOnFailure);
      // Disable timeouts for suites
      suite.timeout(0);
    });
    // Setup the bedrock settings for each test
    runner.on('test', (test) => {
      // 2000 is a hardcoded value. See https://github.com/mochajs/mocha/blob/master/lib/runnable.js#L34
      if (test.timeout() === 2000) {
        test.timeout(timeout);
      }
    });
  };

  return {
    init,
    run
  };
};