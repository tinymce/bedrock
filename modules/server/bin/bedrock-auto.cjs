#!/usr/bin/env node

(async () => {
  const BedrockCli = await import('../lib/main/ts/BedrockCli.js');
  const BedrockAuto = await import('../lib/main/ts/BedrockAuto.js');

  await BedrockCli.run(BedrockAuto, {
    current: process.cwd(),
    bin: __dirname
  });

  await Promise.all([
    new Promise(r => process.stdout.write('', r)),
    new Promise(r => process.stderr.write('', r))
  ]);
})().catch(err => {
  console.error(err);
  process.exitCode = 1;
});