/*
 * Stand-in for `puppeteer-core`, an optional peer dependency of webdriverio that bedrock
 * does not install. Only webdriverio's `getPuppeteer()` types reference it, which bedrock
 * never calls, so the module is remapped here (see `paths` in tsconfig.json) rather than
 * pulling in puppeteer just to satisfy a type import.
 */
export interface Browser {
  readonly [key: string]: unknown;
}
