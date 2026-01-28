#!/usr/bin/env node

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import BedrockCli from "../lib/main/ts/BedrockCli.js";
import BedrockAuto from "../lib/main/ts/BedrockAuto.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

await BedrockCli.run(BedrockAuto, {
  current: process.cwd(),
  bin: __dirname
});
