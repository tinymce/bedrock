/** When tests fail, we often want to print things out.
 * Most of the time it's just a simple string,
 * but sometimes it's something computationally intensive.
 * TestLabel gives us the best of both worlds
 */
export type TestLabel = string | (() => string);

const asString = (l: TestLabel): string =>
  typeof l === 'function' ? l() : l;

const or = (a: TestLabel | null | undefined, b: TestLabel): TestLabel =>
  (a === null || a === undefined) ? b : a;

const asStringOr = (a: TestLabel | null | undefined, b: TestLabel): string =>
  asString(or(a, b));

const map = (l: TestLabel, f: (s: string) => TestLabel): TestLabel =>
  () => asString(f(asString(l)));

const concat = (a: TestLabel, b: TestLabel): TestLabel =>
  () => asString(a) + asString(b);

export const TestLabel = {
  or,
  asString,
  asStringOr,
  map,
  concat
};
