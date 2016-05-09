var XMLWriter = require('xml-writer');

var write = function (raw) {  
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
    w.startElement('testsuites').writeAttribute('tests', results.length).writeAttribute('failures', failed.length).writeAttribute('time', data.time).writeAttribute('errors', 0);
    
    console.log('w', w.toString());

    resolve(results);
  });
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