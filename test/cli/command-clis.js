#!/usr/bin/env node
var clis = require('../../src/js/bedrock/cli/clis.js');
var attemptutils = require('./attempt-utils.js');

var tape = require('tape');

var directories = {
  current: process.cwd(),
  bin: __dirname
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
    "--files", "test/resources/test.file1"
  ]);
  var actual = clis.forAuto(directories);
  attemptutils.assertResult(t, {

  }, actual);
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

