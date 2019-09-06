#!/usr/bin/env node

const BedrockCli = require('../lib/server/ts/BedrockCli');
const BedrockFramework = require('../lib/server/ts/BedrockFramework');

BedrockCli.run(BedrockFramework, {
  current: process.cwd(),
  bin: __dirname
});
