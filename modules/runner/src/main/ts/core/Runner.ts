import { Callbacks } from '../reporter/Callbacks';
import { Reporter, TestReporter } from '../reporter/Reporter';
import { Actions } from '../ui/Actions';
import { Ui } from '../ui/Ui';
import { HarnessResponse } from './ServerTypes';
import { TestData } from './TestTypes';
import { UrlParams } from './UrlParams';
import { noop } from './Utils';

// 5sec interval for the server to know the client hasn't disconnected
// Note: The interval needs to be less than 10secs, otherwise the server will disconnect.
//       See `Controller.ts` in the server.
const KEEP_ALIVE_INTERVAL = 5000;

export const Runner = (globalTests: TestData[], params: UrlParams, callbacks: Callbacks, reporter: Reporter, ui: Ui) => {
  const actions = Actions(params.session);

  const withSum = (action: (offset: number, failed: number, retry?: number) => void, offset = 0, failedOffset = 0) => (retry?: number) => {
    const sum = reporter.summary();
    action(sum.offset + offset, sum.failed + failedOffset, retry);
  };

  const loadNextChunk = (chunk: number): void => {
    if (globalTests.length > (params.offset + chunk)) {
      actions.reloadPage(params.offset + chunk, reporter.summary().failed);
    } else {
      reporter.done();
      // for easy rerun reset the URL
      actions.updateHistory(0, 0);
    }
  };

  const retryTest = withSum(actions.retryTest);
  const loadNextTest = withSum(actions.skipTest);
  const stopTest = withSum(actions.updateHistory, 0, -1);

  const afterFail = (retries: number, stopOnFailure: boolean): void => {
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
    ui.render(params.offset, globalTests.length, actions.restartTests, retryTest, loadNextTest);

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
    const fail = (report: TestReporter, e: any) => {
      console.error(e.error || e);
      report.fail(e, () => afterFail(retries, stopOnFailure));
    };

    const loop = (tests: TestData[]): void => {
      const test = tests.shift();
      if (test !== undefined) {
        const report = reporter.test(test.filePath, test.name, globalTests.length);
        const timer = setTimeout(() => {
          fail(report, { error: new Error('Test ran too long'), logs: [] });
        }, timeout);
        try {
          report.start(() => {
            test.test(() => {
              clearTimeout(timer);
              report.pass(() => {
                if (params.retry > 0) {
                  params.retry = 0;
                  actions.updateHistory(params.offset, params.failed, params.retry);
                }
                loop(tests);
              });
            }, (e) => {
              clearTimeout(timer);
              fail(report, e);
            });
          });
        } catch (e) {
          clearTimeout(timer);
          fail(report, e);
        }
      } else {
        loadNextChunk(chunk);
      }
    };

    ui.setStopOnFailure(stopOnFailure);
    loop(globalTests.slice(params.offset, params.offset + chunk));
  };

  return {
    init,
    run
  }
};