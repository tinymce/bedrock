var create = function (files) {
  var started = false;

  var stream = process.stdout;

  var totalFiles = files.length > 0 ? files.length : '?';

  // TODO: Be able to turn this output off. It will output escape codes which will make
  // jenkins output less readable.

  var writeProgress = function (numPassed, numFailed, total) {
    var numRun = numPassed + numFailed;
    stream.write(
      'Passed: ' + numPassed + '/' + total +
      ', Failed: ' + numFailed + '/' + total +
      ' [' + numRun + ']  ... ' + '\n'
    );
    stream.clearLine(2);
    return Promise.resolve({});
  };

  var update = function (data) {
    if (started) {
      // Note, this writes over the above line, which is why we only do this after the first update.
      stream.moveCursor(0, -2);
    } else {
      started = true;
    }
    stream.clearLine(0);
    stream.cursorTo(0);
    stream.write('Current test: ' + (data.test !== undefined ? data.test : 'Unknown') + '\n');
    return writeProgress(data.numPassed, data.numFailed, data.totalFiles !== undefined ? data.totalFiles : totalFiles);
  };

  var complete = function () {
    return Promise.resolve({});
  };

  return {
    update: update,
    complete: complete
  };
};


module.exports = {
  create: create
};