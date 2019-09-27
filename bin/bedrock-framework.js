#!/usr/bin/env node

const BedrockCli = require('../lib/server/main/ts/BedrockCli');
const BedrockFramework = require('../lib/server/main/ts/BedrockFramework');

BedrockCli.run(BedrockFramework, {
  current: process.cwd(),
  bin: __dirname
});
