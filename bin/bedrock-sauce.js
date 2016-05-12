#!/usr/bin/env node
var bedrock = require('../src/js/bedrock-sauce');
bedrock.run({
  current: process.cwd(),
  bin: __dirname
});