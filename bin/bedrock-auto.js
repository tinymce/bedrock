#!/usr/bin/env node

const BedrockCli = require('../lib/server/ts/BedrockCli');
const BedrockAuto = require('../lib/server/ts/BedrockAuto');

BedrockCli.run(BedrockAuto, {
  current: process.cwd(),
  bin: __dirname
});
