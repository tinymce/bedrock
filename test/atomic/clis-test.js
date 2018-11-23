#!/usr/bin/env node
var clis = require('../../src/js/bedrock/cli/clis.js');
var attemptutils = require('../util/attempt-utils.js');
var attempt = require('../../src/js/bedrock/core/attempt.js');

var tape = require('tape');

var directories = {
  current: process.cwd(),
  bin: __dirname
};

var exclude = function (fields) {
  return function (obj) {
    var r = {};
    for (var k in obj) {
      if (obj.hasOwnProperty(k)) {
        if (fields.indexOf(k) === -1) r[k] = obj[k];
      }
    }
    return r;
  };
};


var mutateArgs = function (newArgs) {
  process.argv = [ "$executable", "$file" ].concat(newArgs);
};

var cleanError = function (result) {
  return attempt.cata(result, function (err) {
    return attempt.failed(err.errors);
  }, attempt.passed);
};

var cleanResult = function (result) {
  return attempt.cata(result, attempt.failed, function (v) {
    return attempt.passed(exclude([ 'projectdir', 'basedir' ])(v));
  });
};

tape('Minimal specification of bedrock-auto', function (t) {
  mutateArgs([
    "--browser", "MicrosoftEdge",
    "--files", "test/resources/test.file1",
    "--config", "sample/config.js"
  ]);
  var actual = clis.forAuto(directories);
  attemptutils.assertResult(t, {
    browser: 'MicrosoftEdge',
    bundler: 'webpack',
    config: 'sample/config.js',
    name: 'bedrock-run',
    output: 'scratch',
    help: false,
    testfiles: [
      'test/resources/test.file1'
    ],
    debuggingPort: 9000,
    delayExit: false,
    singleTimeout: 30000,
    stopOnFailure: false,
    overallTimeout: 600000,
    loglevel: 'advanced',
    version: false,
    chunk: 100,
    retries: 0
  }, cleanResult(actual));
});

tape('Specification of bedrock-auto missing required field: browser', function (t) {
  mutateArgs([
    "--files", "test/resources/test.file1",
    "--config", "sample/config.js"
  ]);
  var actual = clis.forAuto(directories);
  attemptutils.assertErrors(t, [
    'The *required* output property [browser] from [browser] must be specified'
  ], cleanError(actual));
});

tape('Minimal specification of bedrock-manual', function (t) {
  mutateArgs([
    "--files", "test/resources/test.file1",
    "--config", "sample/config.js"
  ]);
  var actual = clis.forManual(directories);
  attemptutils.assertResult(t, {
    config: 'sample/config.js',
    testfiles: [
      'test/resources/test.file1'
    ],
    help: false,
    bundler: 'webpack',
    singleTimeout: 30000,
    stopOnFailure: false,
    overallTimeout: 600000,
    loglevel: 'advanced',
    version: false,
    chunk: 100,
    retries: 0
  }, attempt.map(actual, exclude([ 'projectdir', 'basedir' ])));
});
