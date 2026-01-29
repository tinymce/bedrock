#!/usr/bin/env node

const BedrockCli = require("../lib/main/ts/BedrockCli");
const BedrockAuto = require("../lib/main/ts/BedrockAuto");

(async () => {
  await BedrockCli.run(BedrockAuto, {
    current: process.cwd(),
    bin: __dirname,
  });
})().catch((err) => {
  console.error(err);
  process.exit(1);
});