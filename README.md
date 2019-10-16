# Description

`bedrock` is a test runner for JavaScript projects. Its primary use is to test Javascript projects, but it also has a `qunit` wrapper. It can run manually (where the user navigates to the browser themselves), or automatically (where `bedrock` starts the browser and runs the tests automatically). Note, in order to run the tests automatically, the appropriate web-drivers need to be installed and available. For more information on setting up web-drivers, see [here](https://www.npmjs.com/package/selenium-webdriver).

# Installation

`bedrock` is available as an `npm` package. You can install it via the npm package `@ephox/bedrock` or from source

## Global Install

A global install will put the bedrock commands (e.g. `bedrock-auto`) automatically on your path.

### Install from npm

`$ npm install -g @ephox/bedrock`

### Install from source (start in source directory)

`$ npm install -g .`



## Local Install

A local install will not put the bedrock commands automatically on your path. After installing locally, you can access the commands via:

1. adding `node_modules/.bin` to your path
2. using `npm run ${command}` from the bedrock source directory

### Install from npm

`npm install @ephox/bedrock`.

### Install from source (start in source directory)

`$ npm install .`


# Usage

`bedrock` has three main modes: test, server, and framework. These are available through three commands: `bedrock-auto`, `bedrock`, and `bedrock-framework`.

## Test mode (bedrock-auto)

*Test* mode allows the user to run tests in an automated fashion. Bedrock will spin up the browser itself (assuming the user has the right web-drivers on the path), establish a web-driver connection with this browser and close the browser once the tests have completed. Information on installing web-drivers can be found [here](https://www.npmjs.com/package/selenium-webdriver).

BROWSER: chrome | firefox | safari | MicrosoftEdge | ie | phantomjs

e.g. run automated bedrock tests in chrome against test directory src/test/js/browser

`bedrock-auto --browser chrome --testdir src/test/js/browser`

Use `bedrock-auto --help` to see all arguments possible.

## Server mode (bedrock)

*Server* mode allows the user to host the tests on localhost:{port} where port is the first free port found between 8000 and 20000. It is the most commonly used mode, and therefore is the default bedrock executable.

`bedrock --files src/test/js/browser/TwoTest.ts`

Use `bedrock --help` to see all arguments possible.

## Framework mode (bedrock-framework)

*Framework* mode allows bedrock to run using an existing framework. The only currently supported testing framework is `qunit`. Bedrock assumes that a single page is responsible for running all the tests, so a `page` and `browser` are the only things required. Another parameter `framework` is also possible, but its only possible value currently is `qunit`.

e.g. Run existing tests on a qunit page using phantom

`bedrock-framework --page tests/index.html --browser phantomjs`

Use `bedrock-framework --help` to see all arguments possible.

# Tests

You can run bedrock's tests by executing:

`$ npm run test`

This will not run `test-samples-fail` which will need to be run and verified manually. (All should fail)

If you just want to run the basic tests (not property-based), use `$ npm run test-atomic`. If you want to run only the property-based tests, use `$ npm run test-props`. If you want to run the sample tests use `$ npm run test-samples-pass` and `$ npm run test-samples-fail`.

## Docker

The `dockerfile` is just to test the no-sandbox option for chrome-headless. We should build automated tests for it.

# FAQ

## Why is the junit XML output not pretty-printed?

It's to do with "escaping" CDATA end tokens ("]]>") in the output. 
If we pretty-print it, we get extraneous whitespace in the junit output rendered in Jenkins. 

See the comment in modules/server/src/main/ts/bedrock/core/Reporter.ts
