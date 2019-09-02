#!/usr/bin/env node

const BedrockCli = require('../src/js/BedrockCli');
const BedrockFramework = require('../src/js/BedrockFramework');

BedrockCli.run(BedrockFramework, {
  current: process.cwd(),
  bin: __dirname
});
