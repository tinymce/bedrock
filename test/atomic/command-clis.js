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

// return cli.extract(
//     'bedrock-auto',
//     'Use a Webdriver to launch a browser and run tests against it.',
//     directories, runnerOptions.concat([
//       cloptions.browser,
//       cloptions.config,
//       cloptions.files,
//       cloptions.testdir,
//       cloptions.name,
//       cloptions.output
//     ])
//   );

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
    config: 'sample/config.js',
    done: 'div.done',
    name: 'bedrock-run',
    output: 'scratch',
    help: false,
    testfiles: [
      'test/resources/test.file1'
    ],

    progress: '.progress',
    results: 'textarea.results',
    singleTimeout: 30000,
    testName: '.test.running .name',
    total: '.total',
    totalTimeout: 600000
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
    done: 'div.done',
    testfiles: [
      'test/resources/test.file1'
    ],
    help: false,

    progress: '.progress',
    results: 'textarea.results',
    singleTimeout: 30000,
    testName: '.test.running .name',
    total: '.total',
    totalTimeout: 600000
  }, attempt.map(actual, exclude([ 'projectdir', 'basedir' ])));
});

tape('Minimal specification of bedrock-remote', function (t) {
  mutateArgs([
    "--files", "test/resources/test.file1",
    "--config", "sample/config.js",
    "--uploaddirs", "test", "src",
    "--bucket", "testing"
  ]);
  var actual = clis.forRemote(directories);
  attemptutils.assertResult(t, {
    uploaddirs: [ 'test', 'src' ],
    bucket: 'testing',
    bucketfolder: 'tunic/bedrock-testing',
    config: 'sample/config.js',
    done: 'div.done',
    help: false,
    testfiles: [
      'test/resources/test.file1'
    ],
    help: false,

    progress: '.progress',
    results: 'textarea.results',
    singleTimeout: 30000,
    testName: '.test.running .name',
    total: '.total',
    totalTimeout: 600000
  }, attempt.map(actual, exclude([ 'projectdir', 'basedir' ])));
});

tape('Minimal specification of bedrock-sauce-single', function (t) {
  mutateArgs([
    "--remoteurl", "remote.url",
    "--sauceuser", "sauce.user",
    "--saucekey", "sauce.key"
  ]);
  var actual = clis.forSauceSingle(directories);
  attemptutils.assertResult(t, {
    remoteurl: 'remote.url',
    done: 'div.done',
    sauceuser: 'sauce.user',
    saucekey: 'sauce.key',
    saucebrowser: 'chrome',
    help: false,
    sauceos: 'Linux',
    saucebrowserVersion: 'latest',
    output: 'scratch',
    name: 'bedrock-run',
    progress: '.progress',
    results: 'textarea.results',
    singleTimeout: 30000,
    testName: '.test.running .name',
    total: '.total',
    totalTimeout: 600000
  }, attempt.map(actual, exclude([ 'projectdir', 'basedir' ])));
});

tape('Specification of bedrock-sauce-single without saucekey', function (t) {
  mutateArgs([
    "--remoteurl", "remote.url",
    "--sauceuser", "sauce.user"
  ]);
  var actual = clis.forSauceSingle(directories);
  attemptutils.assertErrors(t, [
    'The *required* output property [saucekey] from [saucekey] must be specified'
  ], cleanError(actual));
});

tape('Minimal specification of bedrock-sauce', function (t) {
  mutateArgs([
    "--files", "test/resources/test.file1",
    "--config", "sample/config.js",
    "--uploaddirs", "test", "src",
    "--bucket", "testing",
    "--sauceconfig", "test/resources/test.file1",
    "--sauceuser", "sauce.user",
    "--saucekey", "sauce.key"
  ]);
  var actual = clis.forSauce(directories);
  attemptutils.assertResult(t, {
    uploaddirs: [ 'test', 'src' ],
    bucket: 'testing',
    bucketfolder: 'tunic/bedrock-testing',
    config: 'sample/config.js',
    done: 'div.done',
    testfiles: [
      'test/resources/test.file1'
    ],
    name: 'bedrock-run',
    output: 'scratch',
    help: false,

    sauceconfig: 'test/resources/test.file1',
    saucekey: 'sauce.key',
    sauceuser: 'sauce.user',
    progress: '.progress',
    results: 'textarea.results',
    singleTimeout: 30000,
    testName: '.test.running .name',
    total: '.total',
    totalTimeout: 600000
  }, attempt.map(actual, exclude([ 'projectdir', 'basedir' ])));
});