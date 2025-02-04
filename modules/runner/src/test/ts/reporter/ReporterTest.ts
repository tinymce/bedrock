import { Failure, LoggedError } from '@ephox/bedrock-common';
import { assert } from 'chai';
import * as fc from 'fast-check';
import { beforeEach, describe, it } from 'mocha';
import { UrlParams } from '../../../main/ts/core/UrlParams';
import { Callbacks, TestErrorData } from '../../../main/ts/reporter/Callbacks';
import { Reporter } from '../../../main/ts/reporter/Reporter';
import { noop, wait } from '../TestUtils';

interface StartTestData {
  readonly session: string;
  readonly currentCount: number;
  readonly totalTests: number;
  readonly file: string;
  readonly name: string;
}

interface EndTestData {
  readonly session: string;
  readonly file: string;
  readonly name: string;
  readonly passed: boolean;
  readonly time: string;
  readonly error: TestErrorData | null;
  readonly skipped: string | null;
}

const sessionId = '111111';
const params: UrlParams = {
  session: sessionId,
  offset: 0,
  failed: 0,
  skipped: 0,
  retry: 0
};

const ui = {
  test: () => ({
    start: noop,
    pass: noop,
    skip: noop,
    fail: noop,
  }),
  done: noop
};

describe('Reporter.test', () => {
  let reporter: Reporter, startTestData: StartTestData[], endTestData: EndTestData[];
  let doneCalled: boolean, doneError: string | undefined, offset: number;
  const callbacks: Callbacks = {
    loadHarness: () => Promise.resolve({ retries: 0, chunk: 100, stopOnFailure: true, mode: 'manual', timeout: 10000 }),
    sendKeepAlive: () => Promise.resolve(),
    sendInit: () => Promise.resolve(),
    sendTestStart: (session, currentCount, totalTests, file, name) => {
      startTestData.push({ session, currentCount, totalTests, file, name });
      return Promise.resolve();
    },
    sendTestResults: (session, results) => {
      results.forEach(r => endTestData.push({session, ...r}));
      return Promise.resolve();
    },
    sendDone: (session, error) => {
      doneCalled = true;
      doneError = error;
      return Promise.resolve();
    }
  };

  const reset = (newOffset: number = Math.floor(Math.random() * 1000)) => {
    offset = newOffset;
    reporter = Reporter({ ...params, offset }, callbacks, ui);
    startTestData = [];
    endTestData = [];
    doneCalled = false;
    doneError = undefined;
  };

  beforeEach(() => reset());

  it('should report the session id, number tests, file and name on start', () => {
    return fc.assert(fc.asyncProperty(fc.hexaString(), fc.asciiString(), fc.integer(offset), (fileName, testName, testCount) => {
      reset(0);
      const test = reporter.test(fileName + 'Test.ts', testName, testCount);
      test.start();
      return reporter.waitForResults().then(() => {
        assert.equal(startTestData.length, 1, 'Checking there is start test data');
        assert.deepEqual(startTestData[0], {
          currentCount: offset + 1,
          session: sessionId,
          totalTests: testCount,
          file: fileName + 'Test.ts',
          name: testName
        }, 'Checking start test data contents');

        assert.equal(endTestData.length, 0, 'Checking there is no end test data');
        assert.deepEqual(reporter.summary(), {
          offset,
          passed: offset,
          failed: 0,
          skipped: 0
        }, 'Summary has no passed or failed tests');

        assert.isFalse(doneCalled);
      });
    }));
  });

  it('should report the session id, file, name, passed state and time on a skipped test', () => {
    return fc.assert(fc.asyncProperty(fc.hexaString(), fc.asciiString(), fc.asciiString(), fc.integer(offset), (fileName, testName, skippedMessage, testCount) => {
      reset();
      const test = reporter.test(fileName + 'Test.ts', testName, testCount);
      test.start();
      test.skip(skippedMessage);
      return reporter.waitForResults()
        .then(() => {
          assert.equal(endTestData.length, 1, 'Checking there is end test data');
          const data = endTestData[0];
          assert.equal(data.session, sessionId, 'Checking session ID');
          assert.equal(data.file, fileName + 'Test.ts', 'Checking filename');
          assert.equal(data.name, testName, 'Checking testname');
          assert.isFalse(data.passed, 'Checking passed state');
          assert.equal(data.skipped, skippedMessage, 'Checking skipped message');
          assert.isNull(data.error, 'Checking no error');
          assert.isString(data.time, 'Checking time');

          assert.deepEqual(reporter.summary(), {
            offset,
            passed: offset,
            failed: 0,
            skipped: 1
          }, 'Summary has one skipped test');

          assert.isFalse(doneCalled);
        });
    }));
  });

  it('should report the session id, file, name, passed state, time and error on a test failure', () => {
    return fc.assert(fc.asyncProperty(fc.hexaString(), fc.asciiString(), fc.integer(offset), (fileName, testName, testCount) => {
      reset();
      const test = reporter.test(fileName + 'Test.ts', testName, testCount);
      const error = LoggedError.loggedError(new Error('Failed'), [ 'Log Message' ]);

      test.start();
      test.fail(error);
      return reporter.waitForResults()
        .then(() => {
          assert.equal(endTestData.length, 1, 'Checking there is end test data');
          const data = endTestData[ 0 ];
          assert.equal(data.session, sessionId, 'Checking session ID');
          assert.equal(data.file, fileName + 'Test.ts', 'Checking filename');
          assert.equal(data.name, testName, 'Checking testname');
          assert.isFalse(data.passed, 'Checking passed state');
          assert.isNull(data.skipped, 'Checking skipped state');
          assert.isString(data.time, 'Checking time');
          assert.equal(data.error?.text, 'Error: Failed\n\nLogs:\nLog Message', 'Checking error text');

          assert.deepEqual(reporter.summary(), {
            offset,
            passed: offset,
            failed: 1,
            skipped: 0
          }, 'Summary has one failed test');

          assert.isFalse(doneCalled);
        });
    }));
  });

  it('should report done', async () => {
    reporter.done();
    // done waits about 100ms, so we have to wait 150
    await wait(150);
    assert.isTrue(doneCalled);
    assert.isUndefined(doneError);
  });

  it('should report done with an error', async () => {
    reporter.done(Failure.prepFailure('Unexpected error occurred'));
    // done waits about 100ms, so we have to wait 150
    await wait(150);
    await Promise.resolve();
    assert.isTrue(doneCalled);
    assert.include(doneError, 'Unexpected error occurred');
  });
});
