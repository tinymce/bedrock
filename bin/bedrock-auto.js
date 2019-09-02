#!/usr/bin/env node

const BedrockCli = require('../src/js/BedrockCli');
const BedrockAuto = require('../src/js/BedrockAuto');

BedrockCli.run(BedrockAuto, {
  current: process.cwd(),
  bin: __dirname
});
