import * as fc from 'fast-check';

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = (): void => {};

export const hexChar = fc.constantFrom('0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f');

export const range = <T>(count: number, fn: (idx: number) => T): T[] => {
  const r: T[] = [];
  for (let i = 0; i < count; i++) {
    r.push(fn(i));
  }
  return r;
};

export const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
