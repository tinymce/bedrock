#!/usr/bin/env node

const cli = require('../src/js/BedrockCli');
const bedrock = require('../src/js/BedrockAuto');

cli.run(bedrock, {
  current: process.cwd(),
  bin: __dirname
});
