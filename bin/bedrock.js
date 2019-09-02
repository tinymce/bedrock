#!/usr/bin/env node

const BedrockCli = require('../src/js/BedrockCli');
const BedrockManual = require('../src/js/BedrockManual');

BedrockCli.run(BedrockManual, {
  current: process.cwd(),
  bin: __dirname
});
