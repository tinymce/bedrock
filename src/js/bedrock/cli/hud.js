var create = function (files) {
  var started = false;

  var stream = process.stdout;

  var writeProgress = function (numPassed, numFailed) {
    var numRun = numPassed + numFailed;
    stream.write(
      'Passed: ' + numPassed + '/' + files.length +
      ', Failed: ' + numFailed + '/' + files.length +
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
    return writeProgress(data.numPassed, data.numFailed);
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