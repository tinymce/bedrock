#!/usr/bin/env node
var clis = require('../../src/js/bedrock/cli/clis.js');
var attemptutils = require('./attempt-utils.js');
var attempt = require('../../src/js/bedrock/core/attempt.js');

var tape = require('tape');

var directories = {
  current: process.cwd(),
  bin: __dirname
};

var exclude = function (fields) {
  return function (obj) {
    var r = {};
    for (var k in obj) {
      if (obj.hasOwnProperty(k)) {
        if (fields.indexOf(k) === -1) r[k] = obj[k];
      }
    }
    return r;
  };
};

// return cli.extract(
//     'bedrock-auto',
//     'Use a Webdriver to launch a browser and run tests against it.',
//     directories, runnerOptions.concat([
//       cloptions.browser,
//       cloptions.config,
//       cloptions.files,
//       cloptions.testdir,
//       cloptions.name,
//       cloptions.output
//     ])
//   );

var mutateArgs = function (newArgs) {
  process.argv = [ "$executable", "$file" ].concat(newArgs);
};

tape('Minimal specification of bedrock-auto', function (t) {
  mutateArgs([
    "--browser", "MicrosoftEdge",
    "--files", "test/resources/test.file1",
    "--config", "sample/config.js"
  ]);
  var actual = clis.forAuto(directories);
  attemptutils.assertResult(t, {
    browser: 'MicrosoftEdge',
    config: 'sample/config.js',
    done: 'div.done',
    name: 'bedrock-run',
    output: 'scratch',
    progress: '.progress',
    results: 'textarea.results',
    singleTimeout: 30000,
    testName: '.test.running .name',
    testfiles: [
      'test/resources/test.file1'
    ],
    total: '.total',
    totalTimeout: 600000
  }, attempt.map(actual, exclude([ 'projectdir', 'basedir' ])));
});

// var checkError = function (label, args) {
//   process.argv = args;
//   var settings = autocli.extract(directories);
//   console.error('Test should have failed\n  ' + label);
//   process.exit(-1);
// };

// checkError(
//   'Test 1: bedrock-auto with unknown flag',
//   [
//     "$executable", "$file",
//     "--flag"
//   ]
// );

