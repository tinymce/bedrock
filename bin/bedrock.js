#!/usr/bin/env node

const BedrockCli = require('../lib/server/ts/BedrockCli');
const BedrockManual = require('../lib/server/ts/BedrockManual');

BedrockCli.run(BedrockManual, {
  current: process.cwd(),
  bin: __dirname
});
