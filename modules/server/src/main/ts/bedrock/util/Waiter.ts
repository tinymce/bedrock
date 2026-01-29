export const delay = <T>(value: T, amount: number): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(value);
    }, amount);
  });
};

export type Deferred<T> = {
  promise: Promise<T>;
  resolve: (v: T) => void;
  reject: (e: any) => void;
}

export const defer = <T>(): Deferred<T> => {
  let resolve!: (v: T) => void;
  let reject!: (e: any) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};