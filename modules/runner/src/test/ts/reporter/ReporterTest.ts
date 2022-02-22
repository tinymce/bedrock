import { Failure, LoggedError } from '@ephox/bedrock-common';
import Promise from '@ephox/wrap-promise-polyfill';
import { assert } from 'chai';
import * as fc from 'fast-check';
import { beforeEach, describe, it } from 'mocha';
import { UrlParams } from '../../../main/ts/core/UrlParams';
import { Callbacks, TestErrorData } from '../../../main/ts/reporter/Callbacks';
import { Reporter } from '../../../main/ts/reporter/Reporter';
import { noop } from '../TestUtils';

interface StartTestData {
  readonly session: string;
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
    sendTestStart: (session, totalTests, file, name) => {
      startTestData.push({ session, totalTests, file, name });
      return Promise.resolve();
    },
    sendTestResult: (session, file, name, passed, time, error, skipped) => {
      endTestData.push({ session, file, name, passed, time, error, skipped });
      return Promise.resolve();
    },
    sendDone: (session, error) => {
      doneCalled = true;
      doneError = error;
      return Promise.resolve();
    }
  };

  const reset = () => {
    offset = Math.floor(Math.random() * 1000);
    reporter = Reporter({ ...params, offset }, callbacks, ui);
    startTestData = [];
    endTestData = [];
    doneCalled = false;
    doneError = undefined;
  };

  beforeEach(reset);

  it('should report the session id, number tests, file and name on start', () => {
    return fc.assert(fc.asyncProperty(fc.hexaString(), fc.asciiString(), fc.integer(offset), (fileName, testName, testCount) => {
      reset();
      const test = reporter.test(fileName + 'Test.ts', testName, testCount);
      return test.start().then(() => {
        assert.equal(startTestData.length, 1);
        assert.deepEqual(startTestData[0], {
          session: sessionId,
          totalTests: testCount,
          file: fileName + 'Test.ts',
          name: testName
        });

        assert.equal(endTestData.length, 0);
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

  it('should report the session id, file, name, passed state and time on a test success', () => {
    return fc.assert(fc.asyncProperty(fc.hexaString(), fc.asciiString(), fc.integer(offset), (fileName, testName, testCount) => {
      reset();
      const test = reporter.test(fileName + 'Test.ts', testName, testCount);
      return test.start()
        .then(test.pass)
        .then(() => {
          assert.equal(endTestData.length, 1);
          const data = endTestData[0];
          assert.equal(data.session, sessionId);
          assert.equal(data.file, fileName + 'Test.ts');
          assert.equal(data.name, testName);
          assert.isTrue(data.passed);
          assert.isNull(data.skipped);
          assert.isNull(data.error);
          assert.isString(data.time);

          assert.deepEqual(reporter.summary(), {
            offset,
            passed: offset + 1,
            failed: 0,
            skipped: 0
          }, 'Summary has one passed test');

          assert.isFalse(doneCalled);
        });
    }));
  });

  it('should report the session id, file, name, passed state and time on a skipped test', () => {
    return fc.assert(fc.asyncProperty(fc.hexaString(), fc.asciiString(), fc.asciiString(), fc.integer(offset), (fileName, testName, skippedMessage, testCount) => {
      reset();
      const test = reporter.test(fileName + 'Test.ts', testName, testCount);
      return test.start()
        .then(() => test.skip(skippedMessage))
        .then(() => {
          assert.equal(endTestData.length, 1);
          const data = endTestData[0];
          assert.equal(data.session, sessionId);
          assert.equal(data.file, fileName + 'Test.ts');
          assert.equal(data.name, testName);
          assert.isFalse(data.passed);
          assert.equal(data.skipped, skippedMessage);
          assert.isNull(data.error);
          assert.isString(data.time);

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

      return test.start()
        .then(() => test.fail(error))
        .then(() => {
          assert.equal(endTestData.length, 1);
          const data = endTestData[ 0 ];
          assert.equal(data.session, sessionId);
          assert.equal(data.file, fileName + 'Test.ts');
          assert.equal(data.name, testName);
          assert.isFalse(data.passed);
          assert.isNull(data.skipped);
          assert.isString(data.time);
          assert.equal(data.error?.text, 'Error: Failed\n\nLogs:\nLog Message');

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

  it('should report done', () => {
    reporter.done();
    assert.isTrue(doneCalled);
    assert.isUndefined(doneError);
  });

  it('should report done with an error', () => {
    reporter.done(Failure.prepFailure('Unexpected error occurred'));
    assert.isTrue(doneCalled);
    assert.include(doneError, 'Unexpected error occurred');
  });
});