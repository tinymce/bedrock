/*
 * Stand-in for `urlpattern-polyfill`, which webdriverio pulls in for request interception.
 *
 * The published types declare a global `class URLPattern`, which collides with the
 * `URLPattern` declarations in both lib.dom and @types/node and is only silenced by
 * `skipLibCheck`. Bedrock never uses webdriverio's mocking APIs, so the module is remapped
 * here (see `paths` in tsconfig.json) onto the platform type instead.
 */
export type URLPattern = globalThis.URLPattern;
export declare const URLPattern: typeof globalThis.URLPattern;
