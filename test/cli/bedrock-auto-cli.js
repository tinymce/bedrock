#!/usr/bin/env node
var autocli = require('../../src/js/bedrock/core/autocli.js');

var directories = {
  current: process.cwd(),
  bin: __dirname
};

console.log('process', process.argv);


var checkError = function (label, args) {
  process.argv = args;
  var settings = autocli.extract(directories);
  console.error('Test should have failed: ' + label);
  process.exit(-1);
};

checkError(
  'Did not supply browser',
  [
    "$executable", "$file",
    "--config", "sample/config.js",
    "--testdir", "sample",
    "-b",
    "ie"
  ]
);

