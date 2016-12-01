var XMLWriter = require('xml-writer');
var fs = require('fs');
var attempt = require('./attempt');

var logSauceInfo = function (root, settings) {
  return root.startElement('system-out')
    .startCData().text('\nSauceOnDemandSessionID=' + settings.sauce.id + ' job-name=' + settings.sauce.job + '\n')
    .endCData()
    .endElement();
};

var writePollExit = function (settings, pollExit) {
  var jsonResults = JSON.stringify(
    {
      results: pollExit.results,
      time: pollExit.time
    }
  );

  return write({
    name: settings.name,
    output: settings.output
  })(jsonResults).then(function () {
    return Promise.reject(pollExit.message);
  }, function (err) {
    console.error('Error writing report for polling exit condition');
    console.error(err);
    console.error(err.stack);
    return Promise.reject(pollExit.message);
  });
};

var write = function (settings) {
  return function (raw) {
    return new Promise(function (resolve, reject) {
      var data = JSON.parse(raw);
      var results = data.results;
      var failed = results.filter(function (result) {
        return result.passed !== true;
      });

      var w = new XMLWriter();
      w.startDocument();

      var root = w.startElement('testsuites')
        .writeAttribute('tests', results.length)
        .writeAttribute('failures', failed.length)
        .writeAttribute('time', data.time)
        .writeAttribute('errors', 0);

      var suite = w.startElement('testsuite')
        .writeAttribute('tests', results.length)
        .writeAttribute('name', settings.name)
        .writeAttribute('host', 'localhost')
        .writeAttribute('id', 0)
        .writeAttribute('failures', failed.length)
        .writeAttribute('timestamp', new Date().getTime())
        .writeAttribute('time', data.time);

      results.forEach(function (res) {
        var elem = w.startElement('testcase')
          .writeAttribute('name', res.file)
          .writeAttribute('classname', settings.name + '.' + res.name)
          .writeAttribute('time', res.time);

        if (res.passed !== true) {
          elem.startElement('failure')
            .writeAttribute('Test FAILED: some failed assert')
            .writeAttribute('type', 'failure')
            .text(res.error)
            .endElement();
        }
        elem.endElement();
      });
      suite.endElement();

      if (settings.sauce !== undefined) logSauceInfo(root, settings);

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
