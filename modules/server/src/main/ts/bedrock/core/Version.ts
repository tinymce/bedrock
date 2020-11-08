// eslint-disable-next-line @typescript-eslint/no-var-requires
export const get = (): string => 'v' + require('../../../../../package.json').version;
