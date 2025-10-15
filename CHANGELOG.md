# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 15.0.3 - 2025-10-15

## Fixed
- Fixed an issue where `remapper` was still referenced in the webpack config. #TINY-12932

## 15.0.2 - 2025-02-03

## Improved
- Remote webdriver session ID is now logged after connecting #TINY-10835

## Fixed
- Failing tests that retry and then pass could exceed the "tests crashed" server timeout #TINY-11177

## 15.0.1 - 2025-01-27

## Fixed
- AWS remote testing idle timeout was not set #TINY-11177

## 15.0.0 - 2025-01-27

## Added
- New server-side APIs to accept a batch of results instead of a single result #TINY-11177

## Changed
- Reverted TINY-10708 which was a server-side fix
- Client no longer waits for log requests to complete between tests, which should speed up remote testing #TINY-11177
- Console HUD no longer updates for individual tests #TINY-11177
- Client now posts test status only in batches every 30 seconds, this is the only time the console HUD will update #TINY-11177
- Server now controls the remote webdriver idle timeout, and makes sure a keep-alive command is sent regularly

## Removed
- Single result server-side API #TINY-11177
- Server-side monitoring of single test timeouts. This is still monitored client side. #TINY-11177
- The Promise polyfill is no longer allowed on modern NodeJS frameworks so it has been removed. #TINY-11177

## 14.1.5 - 2024-10-18

### Added

- Added static mock service worker js file mapping. #TINY-11415

## 14.1.4 - 2024-03-27

### Fixed
- `IS_CI` now checks that `isTTY` is false. #TINY-10801

## 14.1.3 - 2024-03-14

### Improved

- Reduced progress logs when on CI to 10% intervals #TINY-10708
- Now supports using `pnpm-workspace.yaml` to fetch workspaces #TINY-10688

## 14.1.2 - 2024-01-31

### Fixed
- LambdaTest tunnel now correctly shutdowns if Webdriver creation fails
- Webdriver now uses tunnel name for LambdaTest tunnels #TINY-10604

### Improved
- Tests now correctly reflect their status in LambdaTest dashboards
- Tests use the `--name` argument to correclty name test runs in LambdaTest dashboards

## 14.1.1 - 2024-01-09

### Added
- Added `rightClick` to `MouseEffect.ts` #TINY-10490

## 14.1.0 - 2023-12-14

### Added
- Add `--platformName` and `--browserVersion` arguments for Lambdatest #TINY-10466

## 14.0.0 - 2023-11-27

### Added
- Add `--remote <webdriver>` to support remote webdrivers: aws device farm and lambdatest #TINY-10006
- Tunneling configuration: Ssh Tunneling and LambdaTest Tunneling #TINY-10006

### Changed
- Upgrade to `webdriverio` 8.x.

## 13.6.0 - 2023-10-16

## Improved

- Urls like `/project/node_modules` and `/project/<package name>/node_modules` are now using node package resolve to serve files. #TINY-10281

## 13.5.0 - 2023-07-11

### Fixed
- Add `--useSelenium` command line argument to use a `selenium/standalone-<browser>` docker connection #DEVOPS-813

## 13.4.2 - 2023-06-22

### Fixed
- Add `--guest` command line argument for Microsoft Edge to disable popups like the new Personalization experience. #TINY-10014

## 13.4.1 - 2023-06-09

### Fixed
- update `fork-ts-checker-webpack-plugin`. #TINY-9855

## 13.4.0 - 2023-05-17

### Improved
- Upgraded webdriverio dependencies. #TINY-9852

## 13.3.0 - 2022-08-01

### Improved
- Headless browsers will now detect an available debugging port instead of always using port 9000.
- Allow `edge` to be used as an alias for `MicrosoftEdge`.

### Fixed
- Chrome headless tests no longer hang indefinitely if something else is running on port 9000.
- Modifier keys would not be released on all browsers when using a key effect.
- The error message was lost when running on phantomjs.

## 13.2.1 - 2022-05-17

### Security
- Removed the unused `node-glob` dependency that relied on older versions of packages with security issues.

## 13.2.0 - 2022-05-11

### Added
- Additional webdriver browser capabilities can be passed via the `--extraBrowserCapabilities` argument in the bedrock-auto command.
- Verbose logging mode can be passed via the `--verbose` argument in bedrock and bedrock-auto.

## 13.1.0 - 2022-02-22

### Added
- Images (svg, png, gif, jpg, etc...) can now be imported by tests, and will be available as data URIs using the `asset/inline` webpack loader.

## Improved
- The mouse position reset logic now only runs when required, instead of for every test.

## 13.0.1 - 2022-02-01

### Fixed
- The `webpack-dev-server` warning overlay would incorrectly show for re-exported types.

## 13.0.0 - 2022-01-10

### Added
- Added the ability to serve binary files from custom routes.

### Improved
- Upgrade to `webpack-dev-server` 4.x.

### Fixed
- Webdriver.io failed to connect to the webdriver instance on Node.js 17.

### Removed
- Removed the deprecated `assert` client API.
- Removed the TypeScript compiler `declarationMap` and `rootDir` overrides.

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
