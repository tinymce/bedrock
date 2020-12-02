import { LoggedError } from '@ephox/bedrock-common';
import { assert } from 'chai';
import * as fc from 'fast-check';
import { beforeEach, describe, it } from 'mocha';
import { UrlParams } from '../../../main/ts/core/UrlParams';
import { Callbacks } from '../../../main/ts/reporter/Callbacks';
import { Reporter } from '../../../main/ts/reporter/Reporter';

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
  readonly error: string | null;
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

const noop = () => {};
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
  let doneCalled: boolean, offset: number;
  const callbacks: Callbacks = {
    sendKeepAlive: (_session, success) => success({}),
    sendTestStart: (session, totalTests, file, name, success) => {
      startTestData.push({ session, totalTests, file, name });
      success({});
    },
    sendTestResult: (session, file, name, passed, time, error, skipped, success) => {
      endTestData.push({ session, file, name, passed, time, error, skipped });
      success({});
    },
    sendDone: (_session, success) => {
      doneCalled = true;
      success({});
    }
  };

  beforeEach(() => {
    offset = Math.floor(Math.random() * 1000);
    reporter = Reporter({ ...params, offset }, callbacks, ui);
    startTestData = [];
    endTestData = [];
    doneCalled = false;
  });

  it('should report the session id, number tests, file and name on start', (done) => {
    fc.assert(fc.property(fc.hexaString(), fc.asciiString(), fc.integer(offset), (fileName, testName, testCount) => {
      const test = reporter.test(fileName + 'Test.ts', testName, testCount);
      test.start(() => {
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
        done();
      });
    }));
  });

  it('should report the session id, file, name, passed state and time on a test success', (done) => {
    fc.assert(fc.property(fc.hexaString(), fc.asciiString(), fc.integer(offset), (fileName, testName, testCount) => {
      const test = reporter.test(fileName + 'Test.ts', testName, testCount);
      test.start(() => {
        test.pass(() => {
          assert.equal(endTestData.length, 1);
          const data = endTestData[ 0 ];
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
          done();
        });
      });
    }));
  });

  it('should report the session id, file, name, passed state and time on a skipped test', (done) => {
    fc.assert(fc.property(fc.hexaString(), fc.asciiString(), fc.asciiString(), fc.integer(offset), (fileName, testName, skippedMessage, testCount) => {
      const test = reporter.test(fileName + 'Test.ts', testName, testCount);
      test.start(() => {
        test.skip(skippedMessage, () => {
          assert.equal(endTestData.length, 1);
          const data = endTestData[ 0 ];
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
          done();
        });
      });
    }));
  });

  it('should report the session id, file, name, passed state, time and error on a test failure', (done) => {
    fc.assert(fc.property(fc.hexaString(), fc.asciiString(), fc.integer(offset), (fileName, testName, testCount) => {
      const test = reporter.test(fileName + 'Test.ts', testName, testCount);
      const error = LoggedError.loggedError(new Error('Failed'), [ 'Log Message' ]);

      test.start(() => {
        test.fail(error, () => {
          assert.equal(endTestData.length, 1);
          const data = endTestData[ 0 ];
          assert.equal(data.session, sessionId);
          assert.equal(data.file, fileName + 'Test.ts');
          assert.equal(data.name, testName);
          assert.isFalse(data.passed);
          assert.isNull(data.skipped);
          assert.isString(data.time);
          assert.equal(data.error, 'Error: Failed\n\nLogs:\nLog Message');

          assert.deepEqual(reporter.summary(), {
            offset,
            passed: offset,
            failed: 1,
            skipped: 0
          }, 'Summary has one failed test');

          assert.isFalse(doneCalled);
          done();
        });
      });
    }));
  });

  it('should report done', () => {
    reporter.done();
    assert.isTrue(doneCalled);
  });
});