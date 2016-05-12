#!/usr/bin/env node

var bedrock = require('../src/js/bedrock-remote');
bedrock.run({
  current: process.cwd(),
  bin: __dirname
});
