#!/usr/bin/env node

const BedrockCli = require('../lib/server/main/ts/BedrockCli');
const BedrockManual = require('../lib/server/main/ts/BedrockManual');

BedrockCli.run(BedrockManual, {
  current: process.cwd(),
  bin: __dirname
});
