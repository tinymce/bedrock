#!/usr/bin/env node

const BedrockCli = require('../lib/main/ts/BedrockCli');
const BedrockFramework = require('../lib/main/ts/BedrockFramework');

BedrockCli.run(BedrockFramework, {
  current: process.cwd(),
  bin: __dirname
});
