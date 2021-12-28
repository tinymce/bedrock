# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 13.0.0 - 2022-01-10

### Improved
- Upgrade to `webpack-dev-server` 4.x.

## 12.3.2 - 2022-01-04

### Fixed
- The webdriver process would not be stopped in some cases when tests successfully completed.
- The server would not gracefully shutdown if an unexpected runner error occurred.
- The wrong timeout value was reported when using the bedrock configured defaults.
- Uncaught errors from other windows or frames wouldn't report correctly.

## 12.3.1 - 2021-12-08

### Fixed
- Rolled back to using the old `@ephox/wrap-promise-polyfill` due to `promise-polyfill` never attempting to use the native Promise implementation and was quite slow.

## 12.3.0 - 2021-12-07

### Changed
- Swap from using the `@ephox/wrap-promise-polyfill` wrapper to using `promise-polyfill` directly.

## 12.2.0 - 2021-11-18

### Changed
- Use inline source maps when running in manual mode.

### Fixed
- Webpack compilations were incorrectly triggered when the previous compilation finished and no changes had been made.

## 12.1.1 - 2021-09-20

### Fixed
- Fixed compilation issues on Windows due to incorrect paths.

## 12.1.0 - 2021-09-16

### Improved
- `process.env.NODE_ENV` is now set to `development` using a webpack `DefinePlugin`.

## 12.0.0 - 2021-09-06

### Improved
- Upgrade to `ts-loader` 9.x and `fork-ts-checker-webpack-plugin` 6.x to properly support TypeScript project references.

### Changed
- Upgrade to `webdriverio` 7.x.
- Upgrade to `webpack` 5.x.
- Convert to using `async`/`await` syntax on the server.
- Replaced `istanbul-instrumenter-loader` with `coverage-istanbul-loader` as the former is no longer maintained.

### Removed
- Dropped support for versions of Node.js below version 12.

## 11.5.0 - 2021-08-30

### Improved
- Improved test execution time on `Chrome` and `Edge` by using a faster mouse reset action.

## 11.4.0 - 2021-08-25

### Improved
- Stack traces for failed tests will now be resolved using the sourcemap where possible.

## 11.3.3 - 2021-08-16

### Fixed
- The bedrock-auto `--debuggingPort` argument didn't work for PhantomJS.

## 11.3.2 - 2021-08-12

### Fixed
- The runner was incorrectly using unpolyfilled Promises.
- The first stack trace line was incorrectly removed on Firefox.

## 11.3.1 - 2021-06-10

### Fixed
- BDD hooks failed to register when passing `undefined` as the title.

## 11.3.0 - 2021-06-02

### Improved
- The error messages printed to the terminal will now be coloured and syntax highlighted.

### Changed
- The legacy assertion module now throws an `AssertionError` instead of a generic `Error`.

### Deprecated
- Formally deprecated the legacy assertion module.

## 11.2.1 - 2021-05-31

### Fixed
- Bedrock didn't fail if the generated test script had syntax errors.

## 11.2.0 - 2021-03-05

### Changed
- The mouse position reset feature, when running in `auto` mode, now also works on Microsoft Edge.

## 11.1.1 - 2021-03-02

### Fixed
- Calling `this.timeout(ms)` inside a hook will no longer be ignored.

## 11.1.0 - 2021-02-24

### Added
- Added support for `.mjs` test files, overridden to load with webpack's `javascript/auto` type instead of `javascript/esm`

## 11.0.2 - 2021-01-22

### Fixed
- Fixed a regression introduced in 11.0.0 whereby --customRoutes couldn't be used in manual mode.

## 11.0.1 - 2021-01-21

### Fixed
- Fixed bedrock not returning a non-zero error code when tests unexpectedly stopped.

## 11.0.0 - 2021-01-14

### Removed
- Removed "framework" mode, which was used for running QUnit tests.

## 10.1.0 - 2021-01-14

### Added
- Added ability to use `--bucket` and `--buckets` params in bedrock and bedrock-auto commands.

## 10.0.2 - 2021-01-13

### Fixed
- Fixed beforeEach and afterEach hooks running in the wrong order.

## 10.0.1 - 2021-01-08

### Fixed
- Fixed tests failing if the title contained "??" in the title.

## 10.0.0 - 2021-01-06

### Added
- Added new `Bdd` module for using mocha compatible BDD style tests.
- Added support for retries and timeouts per test for mocha compatibility.
- Added support for skipping tests.
- Added support for "only" tests.
- Added the `--polyfills` command line parameter which allows including core-js polyfills as part of the test run.

## 9.7.1 - 2020-11-02

### Fixed
- Fixed IE 11 not shutting down with newer IEDriverServer versions.

## 9.7.0 - 2020-10-29

### Added
- Added support for the new Chromium based Microsoft Edge Browser.

### Changed
- Changed `typescript` to be a peer dependency to ensure the project TypeScript version is used.
- Upgraded to WebdriverIO 6 and upgraded other dependencies.

## 9.6.3 - 2020-09-27

### Changed
- Changed the `--testdir` and `--testdirs` command line parameters to expand glob patterns

## 9.6.2 - 2020-07-07

### Fixed
- Fixed tests getting stuck when reaching the maximum retry count.

## 9.6.1 - 2020-06-25

### Fixed
- Fixed incorrectly reported test times.
- Internal runner restructuring.

## 9.6.0 - N/A

### Added
- Added `promiseTest` to test async functions (functions returning promises)

### Changed
- Changed `asynctest` to `asyncTest`, following camelCase conventions. Old spelling remains for compatibility.
- Changed `asyncTest` so that it fails (instead of timing out) when an exception is thrown during execution of the test method.

### Fixed
- Remove the sample "suite" tests. The failing ones were causing timeouts.

## 9.5.2 - N/A

### Fixed
- Fixed JS sourcemaps not working in bedrock manual mode.

## 9.5.1 - 2020-02-28

### Fixed
- Fixed broken import generation for js tests.
- Fixed webpack getting stuck in an infinite compilation loop when compiling many tests.

## 9.5.0 - 2020-02-24

### Added
- Added support for polyfilling `Symbol` if required.

### Fixed
- Fixed tests not running if an imported test can't be parsed.

## 9.4.0 - 2020-02-18

### Added
- Added new `wipeBrowserCache` setting for auto mode to ensure Internet Explorers cache is cleared.

### Changed
- Upgrade dependencies.

### Fixed
- Fixed cache headers not being set for certain assets.

## 9.3.2 - 2019-11-13

### Changed
- Upgrade dependencies.

### Fixed
- Fixed bedrock manual html logs not being escaped.

## 9.3.1 - 2019-10-31

### Fixed
- Fixed encoding of errors for textual output.

## 9.3.0 - 2019-10-29

### Added
- Added toString on PprintAssertionError, so that diffs print nicely in fast-check error reports.

### Changed
- Re-exported TestError in bedrock-client
- Moved more code into bedrock-common

## 9.2.1 - 2019-10-21

### Fixed
- Fixed TS sourcemaps not working in bedrock manual mode.

## 9.2.0 - 2019-10-17

### Changed
- XML CDATA sections are now split if they contain a CDATA end token
- XML output is no longer pretty-printed as a result.
- Assertions made with the new Assert library are no longer encoded as HTML entities in XML and stderr output.

## 9.1.0 - 2019-10-16

### Added
- Added support for Test.bs.js files and made typescript optional.

## 9.0.1 - 2019-10-15

### Changed
- Jenkinsfile refactor

## 9.0.0 - N/A

## Changed
- Split into several packages. Users will now need to depend on "@ephox/bedrock-client" and "@ephox-bedrock-server"
- Monorepo using yarn workspaces and lerna.

## 8.1.0 - N/A

### Added
- New assertions library with composable equality, based on "@ephox/dispute" library.
- Test failures output to stderr (max of 5 failures shown)

## 8.0.2 - N/A

- Changed key effects to use left meta key instead of right meta key.
- Upgraded to Webdriver 5.13.1

## 8.0.0 - N/A

### Changed
- Changed to using webdriver.io instead of selenium's webdriver implementation under the hood.

### Improved
- Improved --debuggingPort to work with firefox in headless mode.

### Fixed
- Fixed chrome-headless not maximizing screen size in auto mode.
- Fixed the frame context not being restored if an error occurred while looking up the frame.
- Fixed the "test ran too long" error not reporting correctly.
- Fixed `--version` printing `[Object object]` instead of the actual version.

## 7.0.4 - N/A

### Changed
- Ported main app to typescript
- Removed unnecessary files from distribution

## 7.0.3 - N/A

### Fixed
- Fixed adding the Array.flatMap polyfill during module import and using a polyfill that was enumerable.
- Fixed duplicate files being packaged.

## 7.0.2 - N/A

### Fixed
- Fixed log messages from tests not being printed in the reports.
- Fixed the mouse reset position added in 4.5.1 not actually positioning to (0, 0).

## 7.0.0 - N/A

### Changed
- Ported runner to TypeScript.

### Removed
- Removed scratch area in runner.

## 6.0.0 - N/A

### Removed
- Major version bump, due to removal of UnitTest.domtest

## 5.1.0 - N/A

### Added
- Added types to client package.
- Allow tests to fail with a TestLabel type.

### Removed
- Removed UnitTest.domtest - this should have been a major version bump.

## 5.0.2 - N/A

### Changed
- Changed the version range for portfinder to be an exact version that doesn't randomize the ports.

## 5.0.0 - N/A

### Added
- Test methods now accept a "string | (() => string)" as the test failure message. See TestLabel.ts

### Changed
- Rename LegacyAssert to Assert

### Removed
- Remove Assert.html - it just made a struct. Not very useful.

## 4.5.3 - N/A

### Added
- Added types internally, and made minor performance tweaks.

## 4.5.2 - N/A

### Fixed
- Fixed bedrock manual throwing incorrect warnings about needing to run with bedrock-auto.

## 4.5.1 - N/A

### Fixed
- Changed resetting the mouse position to only run on Chrome, as it's currently the only browser that uses the hosts mouse position.

## 4.5.0 - N/A

### Changed
- Changed bedrock to reset the mouse position before each test when running in auto mode. This can be disabled with the new `--skipResetMousePosition` option.

## 4.4.2 - N/A

### Fixed
- Don't pin bedrock to use typescript 3.3.x anymore.

## 4.4.0 - N/A

### Added
- Added "bucket" and "buckets" options to grunt task. These options let you run a subset of tests.

## 4.3.3 - N/A

### Fixed
- Fixed failing atomic tests
- Upgraded finalhandler to 1.1.2
- Upgraded command-line-usage to 4.1.0

## 4.3.2 - N/A

### Fixed
- Fixed tests failing to run on Microsoft Edge 18 due to MicrosoftWebDriver.exe changing to W3C mode by default.

## 4.3.1 - N/A

### Changed
- Removed preinstall script requiring yarn over npm

## 4.3.0 - N/A

### Added
- Added a configuration option to pass `no-sandbox` through to chrome-headless. Used for docker tests.

## 4.2.11 - 2019-05-15

### Improved
- Improved --debuggingPort to work with chrome in headless mode.

## 4.2.10 - 2019-05-08

### Fixed
- Fixed so that Test.tsx files are loaded when testing with `--testdir`

## 4.2.9 - 2019-05-05

### Fixed
- Fixed so that tsx files are handled by loaders and remapper

## 4.2.8 - 2019-04-23

### Fixed
- Pinned `fork-ts-checker-webpack-plugin` to use version 1.0.x as 1.1.0 and higher appears to have introduced a regression on Windows.

## 4.2.5 - 2019-04-09

### Fixed
- Fixed an issue where tests could fail with `ERROR in Entry module not found: Error: Can't resolve 'ts-loader'`.

## 4.2.4 - 2019-04-08

### Fixed
- Fixed progress reporting the incorrect total number of tests.
- Fixed missing name attributes in junit reports if a file contained multiple tests.

## 4.2.2 - 2019-03-29

### Fixed
- Changed skipped safari tests to include a dummy result.

## 4.2.1 - 2019-03-28

### Changed
- Disable bedrock-auto tests on Safari as webdriver no longer runs on v12.1.0 due to the --legacy argument being removed.

## 4.2.0 - 2019-03-28

### Added
- Use the `name` property of package.json to add the package name to `/project/` for stable resource URLs
- Add stable URLs for package resources in yarn workspace packages using the package.json name

## 4.1.0 - 2019-03-20

### Changed
- Switched from awesome-typescript-loader to ts-loader + fork-ts-checker-webpack-plugin + tsconfig-paths-webpack-plugin

## 4.0.12 - 2019-02-06

### Fixed
- Revert acorn change in 4.0.11

## 4.0.11 - 2019-02-05

### Fixed
- Hard coded the acorn dependency to less than 6.0.7, as it breaks builds with webpack

## 4.0.10 - 2018-12-14

### Fixed
- Fixed double encoding issue with html diffs.
- Fixed issue where IE would throw split of undefined when reporting errors since trace was sometimes an object.

## 4.0.9 - 2018-12-12

### Fixed
- Fixed encoding issue of raw error messages the if the error message contained html it would be rendered on page.

## 4.0.7 - 2018-12-03

### Removed
- Removed bedrock-repl bin from package.json

## 4.0.6 - 2018-12-03

### Added
- Added startup message listing version for quicker feedback

### Improved
- Improved over-escaping of error messages

### Removed
- Removed bedrock-repl as it didn't make sense without bolt
- Removed all dependence on bolt

## 4.0.5 - 2018-11-30

### Fixed
- Fixed diff error message reporting

## 4.0.3 - 2018-11-30

### Fixed
- Gracefully timeout individual tests

## 4.0.0 - 2018-11-23

### Added
- Test results are sent to node server instead of being scraped using selenium
- Tests are chunked into batches to 'solve' memory leaks
- Tests are retried once on failure (when not stopping)
- Testing page is reloaded on failure to avoid cascades

### Changed
- Test HUD has been reformatted

### Removed
- Removed SauceLabs integration

## 3.2.1 - 2018-10-30

### Added
- Add error content to the UnitTest logging output

## 3.2.0 - 2018-10-30

### Added
- Supports logging history in UnitTest

## 3.0.0 - 2018-08-24

### Changed
- Upgraded to typescript 3

## 2.4.0 - N/A

### Added
- added support for shift key in key combos

## 1.8.0 - 2017-11-09

### Added
- support for chrome and firefox headless modes in bedrock-auto via `chrome-headless` and `firefox-headless`

## 1.7.0 - 2017-07-28

### Added
- added IFrameTest.js to the samples
- introduced '=>' symbol in selectors to represent inside an iframe's contents
- added --delayExit command line option to keep browser open after finishing test run

### Changed
- updated key effects and mouse effects to handle dispatching within iframes
- changed click from an ActionSequence to a WebElement action because Edge supports it

## 1.4.0 - 2016-12-09

### Added
- adds testing page for scraping content
- generates reports on timeouts

### Changed
- uses getText instead of getInnerHtml to match new selenium webdriver APIs

### Improved
- improves test report format
- improves experimental SauceLabs integration
