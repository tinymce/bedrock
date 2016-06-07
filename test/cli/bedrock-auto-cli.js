#!/usr/bin/env node
var autocli = require('../../src/js/bedrock/core/autocli.js');

var directories = {
  current: process.cwd(),
  bin: __dirname
};

var checkError = function (label, args) {
  process.argv = args;
  var settings = autocli.extract(directories);
  console.error('Test should have failed\n  ' + label);
  process.exit(-1);
};

checkError(
  'Test 1: bedrock-auto with unknown flag',
  [
    "$executable", "$file",
    "--flag"
  ]
);

