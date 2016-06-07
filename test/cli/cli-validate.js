var tape = require('tape');
var attempt = require('../../src/js/bedrock/core/attempt.js');

var validation = require('../../src/js/bedrock/cli/validation.js');
var extraction = require('../../src/js/bedrock/cli/extraction.js');

var assertErrors = function (t, expected, actual) {
  attempt.cata(actual, function (errs) {
    t.deepEquals(errs, expected);
    t.end();
  }, function (result) {
    t.fail('Expected errors: ' + JSON.stringify(expected));
    t.end();
  });
};

var assertResult = function (t, expected, actual) {
  attempt.cata(actual, function (errs) {
    t.fail('Unexpected errors: ' + JSON.stringify(errs));
    t.end();
  }, function (result) {
    t.deepEquals(result, expected);
    t.end();
  });
};

var checkErrors = function (label, expected, definitions, settings) {
  tape(label, function (t) {
    var actual = validation.scan(definitions, settings);
    assertErrors(t, expected, actual);
  });
};

var checkResult = function (label, expected, definitions, settings) {
  tape(label, function (t) {
    var actual = validation.scan(definitions, settings);
    assertResult(t, expected, actual);
  });
};

checkErrors(
  'Testing a single file that does not exist',
  [
    'Property [file] has value: [test/resources/test.file1.not.existing]. This file does not exist'
  ],
  [
    { name: 'file', validate: extraction.file }
  ],
  {
    file: 'test/resources/test.file1.not.existing'
  }
);

checkErrors(
  'Testing a directory -> files where the directory does not exist',
  [
    '[test/resources.not.existing] is not a directory.',
  ],
  [
    { name: 'testdir', validate: extraction.files('Test.js') }
  ],
  {
    testdir: 'test/resources.not.existing'
  }
);

checkResult(
  'Testing a directory -> files where the directory does exist, but no files matching pattern',
  {
    /* no files matching pattern */
    other: [ ]
  },
  [
    { name: 'testdir', validate: extraction.files('Test.js'), output: 'other' }
  ],
  {
    testdir: 'test/resources'
  }
);

checkResult(
  'Testing a directory -> files where the directory does exist, but has a file matching pattern',
  {
    other: [
      'test/resources/test.file1'
    ]
  },
  [
    { name: 'testdir', validate: extraction.files(''), output: 'other' }
  ],
  {
    testdir: 'test/resources'
  }
);




// // Returns either a Failure of an array of error messages, or a Success of the settings object
// var scan = function (definitions, settings) {
//   return definitions.reduce(function (rest, defn) {
//     var newValue = defn.multiple === true ? validateMany(defn, settings) : validateOne(defn, settings);

//     return attempt.cata(rest, function (errors) {
//       return attempt.cata(newValue, function (validateErrors) {
//         return attempt.failed(errors.concat(validateErrors));
//       }, function (_) {
//         return attempt.failed(errors);
//       });
//     }, function (result) {
//       return attempt.cata(newValue, function (validateErrors) {
//         return attempt.failed(validateErrors);
//       }, function (v) {
//         var output = defn.output !== undefined ? defn.output : defn.name;
//         // REMOVE MUTATION.
//         result[output] = v;

//         return attempt.passed(result);
//       });
//     });
//   }, attempt.passed({}));
// };