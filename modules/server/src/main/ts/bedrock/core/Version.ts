// eslint-disable-next-line @typescript-eslint/no-require-imports
export const get = (): string => 'v' + require('../../../../../package.json').version;
