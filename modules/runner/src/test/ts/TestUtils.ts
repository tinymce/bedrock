// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = (): void => {};

export const range = <T>(count: number, fn: (idx: number) => T): T[] => {
  const r: T[] = [];
  for (let i = 0; i < count; i++) {
    r.push(fn(i));
  }
  return r;
};

export const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
