var XMLWriter = require('xml-writer');
var fs = require('fs');
var attempt = require('./attempt');

var writePollExit = function (settings, results) {
  return write({
    name: settings.name,
    output: settings.output
  })(results).then(function () {
    return Promise.reject(results.message);
  }, function (err) {
    console.error('Error writing report for polling exit condition');
    console.error(err);
    console.error(err.stack);
    return Promise.reject(results.message);
  });
};

var outputTime = function (runnerTime) {
  // runner adds 's' to the time for human readability, but junit needs just a float value in seconds
  var time = runnerTime;
  return time.charAt(time.length - 1) === 's' ? time.substr(0, time.length - 2) : time;
};

var write = function (settings) {
  return function (data) {
    return new Promise(function (resolve, reject) {
      var results = data.results;
      var time = (data.now - data.start) / 1000;
      var skipped = results.filter(function (result) {
        return result.passed !== true && result.skipped;
      });
      var failed = results.filter(function (result) {
        return result.passed !== true && !result.skipped;
      });

      var w = new XMLWriter(true);
      w.startDocument();

      var root = w.startElement('testsuites')
        .writeAttribute('tests', results.length)
        .writeAttribute('failures', failed.length)
        .writeAttribute('time', time)
        .writeAttribute('errors', 0);

      var suite = w.startElement('testsuite')
        .writeAttribute('tests', results.length)
        .writeAttribute('name', settings.name)
        .writeAttribute('host', 'localhost')
        .writeAttribute('id', 0)
        .writeAttribute('failures', failed.length)
        .writeAttribute('skipped', skipped.length)
        .writeAttribute('timestamp', data.start)
        .writeAttribute('time', time);

      results.forEach(function (res) {
        var elem = w.startElement('testcase')
          .writeAttribute('name', res.file)
          .writeAttribute('classname', settings.name + '.' + res.name)
          .writeAttribute('time', outputTime(res.time));

        if (res.passed !== true) {
          if (res.skipped) {
            elem.startElement('skipped')
              .writeAttribute('message', res.skipped)
          } else {
            elem.startElement('failure')
              .writeAttribute('Test FAILED: some failed assert')
              .writeAttribute('type', 'failure')
              .writeCData(res.error)
              .endElement();
          }
        }
        elem.endElement();
      });
      suite.endElement();

      root.endElement();

      try {
        fs.accessSync(settings.output);
      } catch (err) {
        fs.mkdirSync(settings.output);
      }

      var reportFile = settings.output + '/TEST-' + settings.name + '.xml';
      fs.writeFileSync(reportFile, w.toString());

      if (failed.length > 0) resolve(attempt.failed(['Some tests failed. See {' + reportFile + '} for details.']));
      else resolve(attempt.passed(results));
    });
  };
};

module.exports = {
  writePollExit: writePollExit,
  write: write
};
