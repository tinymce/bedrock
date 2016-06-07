#!/usr/bin/env node
var autocli = require('../../src/js/bedrock/core/autocli.js');

var tape = require('tape');

var directories = {
  current: process.cwd(),
  bin: __dirname
};

var mutateArgs = function (newArgs) {
  process.argv = [ "$executable", "$file" ].concat(newArgs);
};

tape('Should throw an error with unknown flag', function (t) {
  mutateArgs([ ]);
  t.end();
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

