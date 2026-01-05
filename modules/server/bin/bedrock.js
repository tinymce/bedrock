#!/usr/bin/env node

const BedrockCli = require('../lib/main/ts/BedrockCli');
const BedrockManual = require('../lib/main/ts/BedrockManual');

await BedrockCli.run(BedrockManual, {
  current: process.cwd(),
  bin: __dirname
});
