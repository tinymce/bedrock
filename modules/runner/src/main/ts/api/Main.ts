import { Callbacks } from '../core/Callbacks';
import * as Reporter from '../core/Reporter';
import { TestData } from '../core/TestTypes';
import { UrlParams } from '../core/UrlParams';
import { HarnessResponse } from '../core/ServerTypes';
import { makeUrl, noop } from '../core/Utils';

declare const $: JQueryStatic;

// webpack makes this available
const Global: any = window;

const makeSessionId = (): string =>
  '' + Math.ceil((Math.random() * 100000000));

let chunk: number; // set during loadtests
let retries: number; // set during loadtests
let timeout: number; // set during loadtests
const globalTests: TestData[] = Global.__tests ? Global.__tests : [];

const params = UrlParams.parse(window.location.search, makeSessionId);
const callbacks = Callbacks();
const reporter = Reporter.dom($('body'), globalTests.length, params, callbacks);

const initError = (e: any): void => {
  $('body').append('<div class="failed done">ajax error: ' + JSON.stringify(e) + '</div>');
};

const runGlobalTests = (): void => {
  const loadNextChunk = (): void => {
    if (globalTests.length > (params.offset + chunk)) {
      const url = makeUrl(params.session, params.offset + chunk, reporter.summary().failed, 0);
      window.location.assign(url);
    } else {
      reporter.done();
      // for easy rerun reset the URL
      window.history.pushState({}, '', makeUrl(params.session, 0, 0, 0));
    }
  };

  const retryTest = (): void => {
    const sum = reporter.summary();
    window.location.assign(
      makeUrl(
        params.session,
        sum.passed + sum.failed - 1,
        sum.failed - 1,
        params.retry + 1
      )
    );
  };

  const loadNextTest = (): void => {
    const sum = reporter.summary();
    window.location.assign(
      makeUrl(
        params.session,
        sum.passed + sum.failed,
        sum.failed,
        0
      )
    );
  };

  const afterFail = (): void => {
    if (reporter.shouldStopOnFailure()) {
      reporter.done();
      // make it easy to restart at this test
      const sum = reporter.summary();
      const url = makeUrl(params.session, sum.passed + sum.failed - 1, sum.failed - 1, 0);
      window.history.pushState({}, '', url);
    } else if (params.retry < retries) {
      retryTest();
    } else {
      loadNextTest();
    }
  };

  const loop = (tests: TestData[]): void => {
    const test = tests.shift();
    if (test !== undefined) {
      const report = reporter.test(test.filePath, test.name);
      const timer = setTimeout(() => {
        report.fail({ error: new Error('Test ran too long'), logs: [] }, afterFail);
      }, timeout);
      try {
        report.start(() => {
          test.test(() => {
            clearTimeout(timer);
            report.pass(() => {
              if (params.retry > 0) {
                params.retry = 0;
                const url = makeUrl(params.session, params.offset, params.failed, params.retry);
                window.history.pushState({}, '', url);
              }
              loop(tests);
            });
          }, (e) => {
            clearTimeout(timer);
            console.error(e.error || e);
            report.fail(e, afterFail);
          });
        });
      } catch (e) {
        clearTimeout(timer);
        console.error(e);
        report.fail(e, afterFail);
      }
    } else {
      loadNextChunk();
    }
  };

  loop(globalTests.slice(params.offset, params.offset + chunk));
};

const loadtests = (data: HarnessResponse): void => {
  chunk = data.chunk;
  retries = data.retries;
  timeout = data.timeout;
  reporter.setStopOnFailure(data.stopOnFailure);
  if (data.mode === 'auto') {
    // Try to ensure the page has focus
    window.focus();
  }
  runGlobalTests();
};

const testrunner = (): void => {
  const keepAliveTimer = setInterval(() => {
    callbacks.sendKeepAlive(params.session, noop, () => {
      // if the server shuts down stop trying to send messages
      clearInterval(keepAliveTimer);
    });
  }, 5000);

  // delay this ajax call until after the reporter status elements are in the page
  $((): void => {
    // noinspection JSIgnoredPromiseFromCall
    $.ajax({
      url: 'harness',
      dataType: 'json',
      success: loadtests,
      error: initError,
    });
  });
};

testrunner();
