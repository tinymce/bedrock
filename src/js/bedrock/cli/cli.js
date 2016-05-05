var extract = function (directories) {
  // Node
  process.argv.shift();
  // File
  process.argv.shift();


  console.log('arv', process.argv);
  if (process.argv.length < 2)
    fail_usage(1, 'Not enough arguments, must specify configuration and at least one test file.');


  // Read config.
  var config = process.argv[0];
  process.argv.shift();

  // Read tests
  var fs = require('fs');

  if (!fs.existsSync(config) || !fs.statSync(config).isFile())
    fail(10, 'Could not find config file [' + config + ']');

  var testfiles = process.argv.slice(0);

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
    basedir: directories.bin + '/../'
  };
};

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


// module.exports = function (help_mode) {
//   if (help_mode) {
//     console.log(usage());
//     process.exit();
//   }

//   var verbose = false;

//   switch (process.argv[0]) {
//     case '-v':
//     case '--verbose':
//       verbose = true;
//       process.argv.shift();
//       break;
//     default:
//       if (process.argv[0] && process.argv[0][0] === '-')
//         fail_usage(1, 'Unknown flag [' + process.argv[0] +']');
//   }


//   if (process.argv.length < 2)
//     fail_usage(1, 'Not enough arguments, must specify configuration and at least one test file.');

//   var config = process.argv[0];
//   process.argv.shift();

//   var fs = require('fs');

//   if (!fs.existsSync(config) || !fs.statSync(config).isFile())
//     fail(10, 'Could not find config file [' + config + ']');

//   var tests = process.argv.slice(0);

//   tests.forEach(function (file) {
//     if (!fs.existsSync(file) || !fs.statSync(file).isFile())
//       fail(20, 'Could not find test file [' + file + ']');
//   });

//   var boltConfig = {
//     verbose: verbose,
//     config: config,
//     tests: tests
//   };

//   var exit = function (success) {
//     process.exit(success ? 0 : 1);
//   };

//   require('../npm/bolt').test(boltConfig, console.log, console.error, exit);
// };







// bedrock.run({
//   testfiles: [ ]
// });

// return;




// PROJECT_LOCATION=$PWD
// echo "Project location $PROJECT_LOCATION"
// echo "$0"

// FILE_LOCATION=`printf "%s" "$0"`
// if [ -L "$0" ]
// then
//  FILE_LOCATION=`(readlink "$0" || printf "%s" "$0")`
// fi

// DIR_LOCATION=$(dirname "$FILE_LOCATION")

// echo $DIR_LOCATION
// echo "Done"


// ARGS=`echo $@ | tr ':' ' '`
// echo $ARGS
// (cd $DIR_LOCATION/.. && npm "--testfiles=\"$ARGS\"" --projectdir="\"$PROJECT_LOCATION\"" run run-selenium)
