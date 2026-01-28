#!/usr/bin/env node

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import BedrockCli from "../lib/main/ts/BedrockCli.js";
import BedrockManual from "../lib/main/ts/BedrockManual.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

await BedrockCli.run(BedrockManual, {
  current: process.cwd(),
  bin: __dirname
});
