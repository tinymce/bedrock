export const delay = <T>(value: T, amount: number): Promise<T> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(value);
    }, amount);
  });
};
