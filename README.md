# Description

`bedrock` is a test runner for JavaScript projects. Its primary use is to test Javascript projects, but it also has a `qunit` wrapper. It can run manually (where the user navigates to the browser themselves), or automatically (where `bedrock` starts the browser and runs the tests automatically). Note, in order to run the tests automatically, the appropriate web-drivers need to be installed and available. For more information on setting up web-drivers, see [here](https://www.npmjs.com/package/selenium-webdriver).

# Installation

`bedrock` is available as an `npm` package. You can install it via the npm package `@ephox/bedrock-server` or from source

## Global Install

A global install will put the bedrock commands (e.g. `bedrock-auto`) automatically on your path.

### Install from npm

`$ npm install -g @ephox/bedrock-server`

### Install from source (start in source directory)

`$ npm install -g .`

## Local Install

A local install will not put the bedrock commands automatically on your path. After installing locally, you can access the commands via:

1. adding `node_modules/.bin` to your path
2. using `bun run ${command}` from the bedrock source directory

### Install from npm

`npm install @ephox/bedrock-server`.

### Install from source (start in source directory)

`$ npm install .`

# Usage

Bedrock has two main modes: test and server. These are available through the commands `bedrock-auto` and `bedrock`.

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

# Tests

You can run bedrock's tests by executing:

`$ bun test`

This will not run `test-samples-fail` which will need to be run and verified manually. (All should fail)

If you just want to run the basic tests (not property-based), use `$ bun run test-atomic`. If you want to run only the property-based tests, use `$ bun run test-props`. If you want to run the sample tests use `$ bun run test-samples-pass` and `$ bun run test-samples-fail`.

## Docker

The `dockerfile` is just to test the no-sandbox option for chrome-headless. We should build automated tests for it.

## Using selenium standalone machine

`bedrock-auto` accepts a `--useSelenium` flag to lift the browser driver burden into a docker container.

For local testing you can leverage docker and connect to a local standalone machine. Note that this uses a Linux GUI, so keep that in mind for cross-platform testing.

Start a `selenium/standalone` docker in your local environment:

`docker run -d --net=host --shm-size="2g" selenium/standalone-chrome:latest`.

You can start a remote selenium docker but bedrock does not play nice with this setup as it requires a server to be accessible to the webdriver

`docker run -d -p 4444:4444 -p 7900:7900 --shm-size="2g" selenium/standalone-chrome:latest`

* Make sure that your port 4444 and port 7900 are not in use when running `--net=host`

# FAQ

## Why is the junit XML output not pretty-printed?

It's to do with "escaping" CDATA end tokens ("]]>") in the output. 
If we pretty-print it, we get extraneous whitespace in the junit output rendered in Jenkins. 

See the comment in modules/server/src/main/ts/bedrock/core/Reporter.ts

# Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

