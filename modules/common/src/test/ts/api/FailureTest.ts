import { assert } from 'chai';
import * as fc from 'fast-check';
import { describe, it } from 'mocha';
import * as TestLogs from '../../../main/ts/api/TestLogs';
import * as Failure from '../../../main/ts/api/Failure';

describe('Failure.prepFailure', () => {
  it('should convert a test label to an Error', () => {
    fc.assert(fc.property(fc.string(), (str) => {
      const err = Failure.prepFailure(str);
      assert.typeOf(err, 'Error');
      assert.equal(err.message, str);
      assert.notInclude(err.stack, 'at normalizeError');
      assert.lengthOf(err.logs, 0);
    }));
  });

  it('should convert a thunked test label to an Error', () => {
    fc.assert(fc.property(fc.string(), (str) => {
      const err = Failure.prepFailure(() => str);
      assert.typeOf(err, 'Error');
      assert.equal(err.message, str);
      assert.notInclude(err.stack, 'at normalizeError');
      assert.lengthOf(err.logs, 0);
    }));
  });

  it('should convert an AssertionError object to an actual Error', () => {
    try {
      assert.fail('Test failure');
    } catch (e) {
      const err = Failure.prepFailure(e);
      assert.typeOf(err, 'Error');
      assert.equal(err.name, 'AssertionError');
      assert.equal(err.message, e.message);
      assert.equal(err.stack, e.stack);
      assert.lengthOf(err.logs, 0);
    }
  });

  it('should format logs', () => {
    fc.assert(fc.property(fc.string(), fc.string(), fc.string(), fc.string(), (str, logMessage1, logMessage2, logMessage3) => {
      const log1 = TestLogs.createLogEntry(logMessage1);
      const log2 = TestLogs.createLogEntry(logMessage2);
      const log3 = TestLogs.createLogEntry(logMessage3);
      const logs = TestLogs.init();
      log1.entries.push(log2);
      logs.history.push(log1, log3);

      const err = Failure.prepFailure(new Error(str), logs);
      assert.typeOf(err, 'Error');
      assert.equal(err.message, str);
      assert.equal(err.logs.join('\n'), `  *  ${logMessage1}\n    *  ${logMessage2}\n  *  ${logMessage3}`);
    }));
  });

  it('should format logs with stack trace', () => {
    fc.assert(fc.property(fc.string(), fc.string(), (str, logMessage) => {
      const error = new Error(str);
      const log = TestLogs.createLogEntry(logMessage);
      log.trace = error.stack;
      const logs = TestLogs.init();
      logs.history.push(log);

      const err = Failure.prepFailure(error, logs);
      assert.typeOf(err, 'Error');
      assert.equal(err.message, str);
      assert.equal(err.logs.join('\n'), `  *  ${logMessage}\n\n\n${error.stack}`);
    }));
  });
});