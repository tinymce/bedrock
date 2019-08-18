/** When tests fail, we often want to print things out.
 * Most of the time it's just a simple string,
 * but sometimes it's something computationally intensive.
 * TestLabel gives us the best of both worlds
 */
export type TestLabel = string | (() => string);

const asString = (l: TestLabel): string =>
  typeof l === 'function' ? l() : l;

const asStringOr = (l: TestLabel | null | undefined, or: () => string): string =>
  (l === null || l === undefined) ? or() : asString(l);

const map = (l: TestLabel, f: (s: string) => TestLabel): TestLabel =>
  () => asString(f(asString(l)));

const concat = (a: TestLabel, b: TestLabel): TestLabel =>
  () => asString(a) + asString(b);

export const TestLabel = {
  asString,
  asStringOr,
  map,
  concat
};
