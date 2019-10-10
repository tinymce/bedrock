#!/usr/bin/env node

const BedrockCli = require('../lib/server/main/ts/BedrockCli');
const BedrockAuto = require('../lib/server/main/ts/BedrockAuto');

BedrockCli.run(BedrockAuto, {
  current: process.cwd(),
  bin: __dirname
});
