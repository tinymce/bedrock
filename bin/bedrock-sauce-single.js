#!/usr/bin/env node
var bedrock = require('../src/js/bedrock-sauce-single');
bedrock.run({
  current: process.cwd(),
  bin: __dirname
});