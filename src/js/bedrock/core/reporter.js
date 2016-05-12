var XMLWriter = require('xml-writer');
var fs = require('fs');

var logSauceInfo = function (root, settings) {
  return root.startElement('system-out')
    .startCData().text('\nSauceOnDemandSessionID=' + settings.sauce.id + ' job-name=' + settings.sauce.job + '\n')
    .endCData()
    .endElement();
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
        .writeAttribute('timestamp', 'TIMESTAMP')
        .writeAttribute('time', data.time);

      results.forEach(function (res) {
        var elem = w.startElement('testcase')
          .writeAttribute('name', settings.name + '.' + res.name);

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

      if (!fs.existsSync(settings.output)) fs.mkdirSync(settings.output);
      var reportFile = settings.output + '/TEST-' + settings.name + '.xml';
      fs.writeFileSync(reportFile, w.toString());

      if (failed.length > 0) reject('Some tests failed. See {' + reportFile + '} for details.');
      else resolve(results);
    });
  };
};

module.exports = {
  write: write
};
