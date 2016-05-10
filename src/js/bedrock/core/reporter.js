var XMLWriter = require('xml-writer');

var write = function (settings) {
  return function (raw) {
    // var failed = results.filter(function )
    // TODO: Return a promise.
    return new Promise(function (resolve, reject) {
      var data = JSON.parse(raw);
      var results = data.results;
      var tests = results.length;
      var failed = results.filter(function (result) {
        return result.passed !== true;
      });
      var passed = results.filter(function (result) {
        return result.passed === true;
      });

      var w = new XMLWriter();
      w.startDocument();

      var root = w.startElement('testsuites').
        writeAttribute('tests', results.length).
        writeAttribute('failures', failed.length).
        writeAttribute('time', data.time).
        writeAttribute('errors', 0);

      var suite = w.startElement('testsuite').writeAttribute('tests', results.length).
        writeAttribute('name', settings.name).
        writeAttribute('host', 'localhost').
        writeAttribute('id', 0).
        writeAttribute('failures', failed.length).
        writeAttribute('timestamp', 'TIMESTAMP').
        writeAttribute('time', data.time);

      results.map(function (res) {
        var elem = w.startElement('testcase').writeAttribute('name', settings.name + '.' + res.name);
        if (res.passed !== true) {
          elem.startElement('failure').writeAttribute('Test FAILED: some failed assert').writeAttribute('type', 'failure').text(res.error).endElement();
        }
        elem.endElement();
      });
      suite.endElement();


      if (settings.sauce !== undefined) root.startElement('system-out').startCData().text('\nSauceOnDemandSessionID=' + settings.sauce.id + ' job-name=' + settings.sauce.job + '\n').endCData().endElement();


      root.endElement();



      //<failure message="Test FAILED: some failed assert" type="failure">{result.error}</failure>

      console.log('w', w.toString());

      if (failed.length > 0) reject(results);
      else resolve(results);
    });
  };
};

module.exports = {
  write: write
};



// {
//   "results":
//   [
//     {"name":"RunOperationTest","file":"project/src/test/js/browser/projects/newt/RunOperationTest.js","passed":true,"time":"0.084s"}
//   ],
//   "time":"6.6759s"
// }

// <testsuites tests="89" failures="0" time="297.294426" errors="0">
// <testsuite tests="89" name="Chrome.Linux" hostname="localhost" failures="0" timestamp="2016-05-06T12:23:03+1000" id="0" time="297.294426" errors="0">
// <testcase name="project/src/tests.js" time="2.2765" classname="Chrome.Linux.Multiple Selector Textarea Test"/>

// <system-out>
// <![CDATA[
// SauceOnDemandSessionID=0edbdd3309794ff09033907c993ec3ab job-name=petrie-acceptance
// ]]>
// </system-out>
// </testsuite>
// </testsuites>