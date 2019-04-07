var create = function (testfiles, loglevel) {
  var started = false;

  var stream = process.stdout;

  var numFiles = testfiles.length > 0 ? testfiles.length : '?';

  var writeProgress = function (id, stopped, numPassed, numFailed, total) {
    var numRun = numPassed + numFailed;
    var status = stopped ? (numRun < total ? 'STOPPED' : 'COMPLETE') : 'RUNNING';
    stream.write(
      'Session: ' + id + ', Status: ' + status + ', Progress: ' + numRun + '/' + total +
      ', Failed: ' + numFailed + ' ... ' + '\n'
    );
    stream.clearLine(2);
    return Promise.resolve({});
  };

  var advUpdate = function (data) {
    if (started) {
      // Note, this writes over the above line, which is why we only do this after the first update.
      stream.moveCursor(0, -2);
    } else {
      started = true;
    }
    stream.clearLine(0);
    stream.cursorTo(0);
    stream.write('Current test: ' + (data.test !== undefined ? data.test.substring(0, 60) : 'Unknown') + '\n');
    var totalFiles = data.totalFiles !== undefined ? data.totalFiles : numFiles;
    var totalTests = data.totalTests !== undefined ? data.totalTests : totalFiles;
    return writeProgress(data.id, data.done, data.numPassed, data.numFailed, totalTests);
  };

  var complete = function () {
    return Promise.resolve({});
  };

  var basicUpdate = function (data) {
    stream.write('.');
    return Promise.resolve({});
  };

  var supportsAdvanced = (function () {
    return stream.clearLine !== undefined &&
      stream.moveCursor !== undefined &&
      stream.cursorTo !== undefined;
  })();

  return {
    update: loglevel === 'advanced' && supportsAdvanced ? advUpdate : basicUpdate,
    complete: complete
  };
};


module.exports = {
  create: create
};