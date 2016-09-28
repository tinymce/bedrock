# Description

`bedrock` is a test runner for JavaScript projects. Its primary use is to test `bolt` projects, but it also has a `qunit` wrapper. It can run manually (where the user navigates to the browser themselves), or automatically (where `bedrock` starts the browser and runs the tests automatically). Note, in order to run the tests automatically, the appropriate webdrivers need to be installed and available. For more information on setting up webdrivers, see [here](https://www.npmjs.com/package/selenium-webdriver).

# Installation

`bedrock` is available as an `npm` package. You can install it via `npm install @ephox/bedrock`.

Additionally, you can install it from the source with `npm install .` in the source directory.


# Usage

`bedrock` has three main modes: test, server, and framework.

## test mode (bedrock-auto)

*Test* mode allows the user to run tests in an automated fashion. Bedrock will spin up the browser itself (assuming the user has the right Webdrivers on the path), establish a WebDriver connection with this browser and close the browser once the tests have completed. Information on installing Webdrivers can be found [here](https://www.npmjs.com/package/selenium-webdriver).

BROWSER: chrome | firefox | safari | MicrosoftEdge | ie | phantomjs

e.g. run automated bedrock tests in chrome against test directory src/test/js/browser

`bedrock-auto --browser chrome --testdir src/test/js/browser`

Use `bedrock-auto --help` to see all arguments possible.

## server mode (bedrock)

*Server* mode allows the user to host the tests on localhost:{port} where port is the first free port found between 8000 and 20000. It is the most commonly used mode, and therefore is the default bedrock executable.

`bedrock --files src/test/js/browser/TwoTest.js`

Use `bedrock --help` to see all arguments possible.

## framework mode

*Framework* mode allows bedrock to run using an existing framework. The only currently supported testing framework is `qunit`. Bedrock assumes that a single page is responsible for running all the tests, so a `page` and `browser` are the only things required. Another parameter `framework` is also possible, but its only possible value currently is `qunit`.

e.g. Run existing tests on a qunit page using phantom

`bedrock-framework --page tests/index.html --browser phantomjs`

Use `bedrock-framework --help` to see all arguments possible.

# Tests

You can run bedrock's tests by executing:

`$ npm run test`

If you just want to run the basic tests (not property-based), use `$ npm run test-atomic`. If you want to run only the property-based tests, use `$ npm run test-props`.