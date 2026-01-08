import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const get = (): string => {
  const pkg = require('../../../../../package.json') as { version: string };
  return `v${pkg.version}`;
};
