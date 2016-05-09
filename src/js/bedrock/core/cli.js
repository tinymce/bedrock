var extract = function (args, directories) {
  if (args.length < 2)
    fail_usage(1, 'Not enough arguments, must specify configuration and at least one test file.');


  // Read config.
  var config = args[0];
  args.shift();

  // Read tests
  var fs = require('fs');

  if (!fs.existsSync(config) || !fs.statSync(config).isFile())
    fail(10, 'Could not find config file [' + config + ']');

  var testfiles = args.slice(0);

  testfiles.forEach(function (file) {
    if (!fs.existsSync(file) || !fs.statSync(file).isFile())
      fail(20, 'Could not find test file [' + file + ']');
  });

  var factor = 100000000;

  return {
    testfiles: testfiles,
    projectdir: directories.current,
    config: config,
    overallTimeout: 10 * 60 * 1000 * factor,
    singleTimeout: 30 * 1000 * factor,
    done: 'div.done',
    progress: '.progress',
    total: '.total',
    testName: '.test.running .name',
    failed: '.test.failed',
    results: 'textarea.results',
    basedir: directories.bin + '/../'
  };
};

// TODO:
// Version
// Help
// etc.

var usage = function () {
  return 'usage: bedrock CONFIG TEST1 TEST2 ...\n' +
         '\n' +
         'arguments:\n' +
         '  CONFIG                   The bolt configuration file to be used for tests\n' +
         '  TEST                     A test file. The test file may contain one or more\n' +
         '                           test methods. Test files have an `assert` library\n' +
         '                           exposed to them automatically. There can be more than\n' +
         '                           on test.\n' +
         '\n' +
         'example:\n' +
         '  Run all atomic tests.\n' +
         '\n' +
         '    bedrock config/bolt/atomic.js $(find src/test/js/atomic -name *Test.js)\n' +
         '\n' +
         '\n';
};

/* jshint node:true */
var fail_usage = function (code, message) {
  console.error(message);
  console.error('');
  console.error(usage());
  process.exit(code);
};

var fail = function (code, message) {
  console.error(message);
  process.exit(code);
};

module.exports = {
  extract: extract
};