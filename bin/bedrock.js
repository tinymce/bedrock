#!/usr/bin/env node

var bedrock = require('../src/js/bedrock-manual');
bedrock.run({
  current: process.cwd(),
  bin: __dirname
});
