#!/usr/bin/env node

var bedrock = require('../src/js/bedrock-auto');
bedrock.run({
  current: process.cwd(),
  bin: __dirname
});
