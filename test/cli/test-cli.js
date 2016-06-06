#!/usr/bin/env node
var autocli = require('../../src/js/bedrock/core/autocli.js');

var directories = {
  current: process.cwd(),
  bin: __dirname
};

var settings = autocli.extract(directories);
console.log('settings', settings);

var extract = function () {
  console.log('hi');
};