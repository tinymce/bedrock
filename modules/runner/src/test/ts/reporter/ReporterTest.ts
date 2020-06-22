import { assert } from 'chai';
import * as fc from 'fast-check';
import { beforeEach, describe, it } from 'mocha';
import { UrlParams } from '../../../main/ts/core/UrlParams';
import { Callbacks } from '../../../main/ts/reporter/Callbacks';
import { Reporter } from '../../../main/ts/reporter/Reporter';

interface StartTestData {
  session: string;
  totalTests: number;
  file: string;
  name: string;
}

interface EndTestData {
  session: string;
  file: string;
  name: string;
  passed: boolean;
  time: string;
  error: string | null;
}

const sessionId = '111111';
const params: UrlParams = {
  session: sessionId,
  offset: 0,
  failed: 0,
  retry: 0
};

const noop = () => {};
const ui = {
  test: () => ({
    start: noop,
    pass: noop,
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
    sendTestResult: (session, file, name, passed, time, error, success) => {
      endTestData.push({ session, file, name, passed, time, error });
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
          offset: offset,
          passed: offset,
          failed: 0
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
          assert.isString(data.time);

          assert.deepEqual(reporter.summary(), {
            offset: offset,
            passed: offset + 1,
            failed: 0
          }, 'Summary has one passed test');

          assert.isFalse(doneCalled);
          done();
        });
      });
    }));
  });

  it('should report the session id, file, name, passed state, time and error on a test failure', (done) => {
    fc.assert(fc.property(fc.hexaString(), fc.asciiString(), fc.integer(offset), (fileName, testName, testCount) => {
      const test = reporter.test(fileName + 'Test.ts', testName, testCount);
      const error = {
        error: new Error('Failed'),
        logs: []
      };
      test.start(() => {
        test.fail(error, () => {
          assert.equal(endTestData.length, 1);
          const data = endTestData[ 0 ];
          assert.equal(data.session, sessionId);
          assert.equal(data.file, fileName + 'Test.ts');
          assert.equal(data.name, testName);
          assert.isFalse(data.passed);
          assert.isString(data.time);
          assert.equal(data.error, 'Error: Failed\n\nLogs:\n');

          assert.deepEqual(reporter.summary(), {
            offset: offset,
            passed: offset,
            failed: 1
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
  })
});