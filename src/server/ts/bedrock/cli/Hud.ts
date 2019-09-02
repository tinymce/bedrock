import * as readline from 'readline';

export const create = function (testfiles, loglevel) {
  let started = false;

  const stream = process.stdout;

  const numFiles = testfiles.length > 0 ? testfiles.length : '?';

  const writeProgress = function (id, stopped, numPassed, numFailed, total) {
    const numRun = numPassed + numFailed;
    const status = stopped ? (numRun < total ? 'STOPPED' : 'COMPLETE') : 'RUNNING';
    stream.write(
      'Session: ' + id + ', Status: ' + status + ', Progress: ' + numRun + '/' + total +
      ', Failed: ' + numFailed + ' ... ' + '\n'
    );
    readline.clearLine(stream, 2);
    return Promise.resolve({});
  };

  const advUpdate = function (data) {
    if (started) {
      // Note, this writes over the above line, which is why we only do this after the first update.
      readline.moveCursor(stream, 0, -2);
    } else {
      started = true;
    }
    readline.clearLine(stream, 0);
    readline.cursorTo(stream, 0);
    stream.write('Current test: ' + (data.test !== undefined ? data.test.substring(0, 60) : 'Unknown') + '\n');
    const totalFiles = data.totalFiles !== undefined ? data.totalFiles : numFiles;
    const totalTests = data.totalTests !== undefined ? data.totalTests : totalFiles;
    return writeProgress(data.id, data.done, data.numPassed, data.numFailed, totalTests);
  };

  const complete = function () {
    return Promise.resolve({});
  };

  const basicUpdate = function (data) {
    stream.write('.');
    return Promise.resolve({});
  };

  const supportsAdvanced = (function () {
    return readline.clearLine !== undefined &&
      readline.moveCursor !== undefined &&
      readline.cursorTo !== undefined;
  })();

  return {
    update: loglevel === 'advanced' && supportsAdvanced ? advUpdate : basicUpdate,
    complete: complete
  };
};
