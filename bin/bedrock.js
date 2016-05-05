#!/usr/bin/env node

var bedrock = require('../src/js/bedrock');
bedrock.run({
  current: process.cwd(),
  bin: __dirname
});
