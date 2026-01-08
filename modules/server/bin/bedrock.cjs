#!/usr/bin/env node

(async () => {
  const { default: BedrockCli } = await import('../lib/main/ts/BedrockCli.js');
  const { default: BedrockManual } = await import('../lib/main/ts/BedrockManual.js');

  await BedrockCli.run(BedrockManual, {
    current: process.cwd(),
    bin: __dirname
  })().then((_) => {}).catch( err => {
    console.error(err);
    process.exit(1);
  });
});