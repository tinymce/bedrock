export const delay = <T>(value: T, amount: number): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(value);
    }, amount);
  });
};
