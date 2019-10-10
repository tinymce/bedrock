#!/usr/bin/env node

const BedrockCli = require('../lib/main/ts/BedrockCli');
const BedrockAuto = require('../lib/main/ts/BedrockAuto');

BedrockCli.run(BedrockAuto, {
  current: process.cwd(),
  bin: __dirname
});
