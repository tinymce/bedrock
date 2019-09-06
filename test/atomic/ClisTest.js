#!/usr/bin/env node
var Clis = require('../../lib/server/ts/bedrock/cli/Clis.js');
var AttemptUtils = require('../util/AttemptUtils.js');
var Attempt = require('../../lib/server/ts/bedrock/core/Attempt.js').Attempt;
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
  return Attempt.cata(result, function (err) {
    return Attempt.failed(err.errors);
  }, Attempt.passed);
};

var cleanResult = function (result) {
  return Attempt.cata(result, Attempt.failed, function (v) {
    return Attempt.passed(exclude([ 'projectdir', 'basedir' ])(v));
  });
};

tape('Minimal specification of bedrock-auto', function (t) {
  mutateArgs([
    "--browser", "MicrosoftEdge",
    "--files", "test/resources/test.file1",
    "--config", "sample/tsconfig.json"
  ]);
  var actual = Clis.forAuto(directories);
  AttemptUtils.assertResult(t, {
    browser: 'MicrosoftEdge',
    bundler: 'webpack',
    config: 'sample/tsconfig.json',
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
    retries: 0,
    useSandboxForHeadless: false,
    skipResetMousePosition: false
  }, cleanResult(actual));
});

tape('Specification of bedrock-auto missing required field: browser', function (t) {
  mutateArgs([
    "--files", "test/resources/test.file1",
    "--config", "sample/tsconfig.json"
  ]);
  var actual = Clis.forAuto(directories);
  AttemptUtils.assertErrors(t, [
    'The *required* output property [browser] from [browser] must be specified'
  ], cleanError(actual));
});

tape('Minimal specification of bedrock-manual', function (t) {
  mutateArgs([
    "--files", "test/resources/test.file1",
    "--config", "sample/tsconfig.json"
  ]);
  var actual = Clis.forManual(directories);
  AttemptUtils.assertResult(t, {
    config: 'sample/tsconfig.json',
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
    chunk: 100
  }, Attempt.map(actual, exclude([ 'projectdir', 'basedir' ])));
});
