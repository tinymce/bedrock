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
    '[test/resources.not.existing] is not a directory',
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
      'test/resources/html/screen.html',
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

checkResult(
  'Testing more than one definition, but there is not a setting for it',
  {
    alpha: 'Alpha'
  },
  [
    { name: 'alpha', validate: extraction.any },
    { name: 'beta', validate: attempt.failed }
  ],
  {
    alpha: 'Alpha'
  }
);

checkErrors(
  'Testing more than one definition, but there is a setting for it',
  [
    'Invalid value for property: beta. Actual value: Beta. Required value: one of ["gamma"]'
  ],
  [
    { name: 'alpha', validate: extraction.any },
    { name: 'beta', validate: extraction.inSet([ 'gamma' ]) }
  ],
  {
    alpha: 'Alpha',
    beta: 'Beta'
  }
);



checkResult(
  'Testing more than one definition, all should pass',
  {
    alpha: 'Alpha',
    'new.beta': 'Beta',
    gamma: [ 'test/resources/html/screen.html', 'test/resources/test.file1' ],
    delta: 'test/resources'
  },
  [
    { name: 'alpha', validate: extraction.any },
    { name: 'beta', validate: extraction.any, output: 'new.beta' },
    { name: 'gamma', validate: extraction.files('') },
    { name: 'delta', validate: extraction.directory }
  ],
  {
    alpha: 'Alpha',
    beta: 'Beta',
    gamma: 'test/resources',
    delta: 'test/resources'
  }
);

checkErrors(
  'Testing more than one definition, several fail, so the whole thing should return combined failures',
  [
    'Invalid value for property: alpha. Actual value: Alpha. Required value: one of ["a"]',
    '[test/resources.fake] is not a directory'
  ],
  [
    { name: 'alpha', validate: extraction.inSet([ 'a' ]) },
    { name: 'beta', validate: extraction.any, output: 'new.beta' },
    { name: 'gamma', validate: extraction.files('') },
    { name: 'delta', validate: extraction.inSet([ 'Delta' ]) },
    { name: 'epsilon', validate: extraction.directory },
    { name: 'rho', validate: extraction.any }
  ],
  {
    alpha: 'Alpha',
    beta: 'Beta',
    gamma: 'test/resources',
    delta: 'Delta',
    epsilon: 'test/resources.fake',
    rho: 'Rho'
  }
);