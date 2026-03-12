#!/usr/bin/env node

const BedrockCli = require("../lib/main/ts/BedrockCli");
const BedrockCache = require("../lib/main/ts/BedrockCache");

(async () => {
  await BedrockCli.run(BedrockCache, {
    current: process.cwd(),
    bin: __dirname,
  });
})().catch((err) => {
  console.error(err);
  process.exit(1);
});