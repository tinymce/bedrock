#!/usr/bin/env node

var bedrock = require('../src/js/bedrock-command');
bedrock.run({
  current: process.cwd(),
  bin: __dirname
});
