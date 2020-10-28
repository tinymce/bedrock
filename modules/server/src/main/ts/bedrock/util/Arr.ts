const concat = <T> (x: T[], y: T[]): T[] => x.concat(y);

export const flatten = <T> (xss: T[][]): T[] =>
  xss.reduce(concat, []);

export const bind = <A, B> (xs: A[], f: (t: A) => B[]): B[] =>
  flatten(xs.map(f));

export const bind2 = <A, B, C> (xs: A[], f: (a: A) => B[], g: (b: B) => C[]): C[] =>
  bind(bind(xs, f), g);

export const findMap = <A, B> (xs: ArrayLike<A>, f: (a: A, index: number) => B | null): B | null => {
  for (let i = 0; i < xs.length; i++) {
    const result = f(xs[i], i);
    if (result !== null) {
      return result;
    }
  }

  return null;
};
