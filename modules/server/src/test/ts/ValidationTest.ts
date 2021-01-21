import { describe, it } from 'mocha';
import { Attempt } from '../../main/ts/bedrock/core/Attempt';
import { assertErrors, assertResult } from './AttemptUtils';
import * as Validation from '../../main/ts/bedrock/cli/Validation';
import * as Extraction from '../../main/ts/bedrock/cli/Extraction';
import { ClOption } from '../../main/ts/bedrock/cli/ClOptions';
import { CommandLineOptions } from 'command-line-args';

const checkErrors = function (label: string, expected: string[], definitions: ClOption[], settings: CommandLineOptions) {
  it(label, function () {
    const actual = Validation.scan(definitions, settings);
    assertErrors(expected, actual);
  });
};

const checkResult = function (label: string, expected: CommandLineOptions, definitions: ClOption[], settings: CommandLineOptions) {
  it(label, function () {
    const actual = Validation.scan(definitions, settings);
    assertResult(expected, actual);
  });
};

describe('Validation', () => {
  checkErrors(
    'Testing a single file that does not exist',
    [
      'Property [file] has value: [test/resources/test.file1.not.existing]. This file does not exist'
    ],
    [
      {name: 'file', validate: Extraction.file, description: 'blah'}
    ],
    {
      file: 'test/resources/test.file1.not.existing'
    }
  );

  checkErrors(
    'Testing a directory -> files where the directory does not exist',
    [
      '[test/resources.not.existing] does not match any directories'
    ],
    [
      {name: 'testdir', validate: Extraction.files(['Test.js']), description: 'blah'}
    ],
    {
      testdir: 'test/resources.not.existing'
    }
  );

  checkResult(
    'Testing a directory -> files where the directory does exist, but no files matching pattern',
    {
      /* no files matching pattern */
      other: []
    },
    [
      {name: 'testdir', validate: Extraction.files(['Test.js']), output: 'other', description: 'blah'}
    ],
    {
      testdir: 'src/test/resources'
    }
  );

  checkResult(
    'Testing a directory -> files where the directory does exist, but has a file matching pattern',
    {
      other: [
        'src/test/resources/html/screen.html',
        'src/test/resources/routes.json',
        'src/test/resources/test.file1',
        'src/test/resources/tsconfig.sample.json'
      ]
    },
    [
      {name: 'testdir', validate: Extraction.files(['']), output: 'other', description: 'blah'}
    ],
    {
      testdir: 'src/test/resources'
    }
  );

  checkResult(
    'Testing a directory -> glob search for directories',
    {
      other: [
        'src/test/resources/html/screen.html',
        'src/test/resources/routes.json',
        'src/test/resources/test.file1',
        'src/test/resources/tsconfig.sample.json'
      ]
    },
    [
      {name: 'testdir', validate: Extraction.files(['']), output: 'other', description: 'blah'}
    ],
    {
      testdir: 'src/*/resources'
    }
  );

  checkResult(
    'Testing more than one definition, but there is not a setting for it',
    {
      alpha: 'Alpha'
    },
    [
      {name: 'alpha', validate: Extraction.any, description: 'blah'},
      {name: 'beta', validate: (x) => Attempt.failed([x]), description: 'blah'}
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
      {name: 'alpha', validate: Extraction.any, description: 'blah'},
      {name: 'beta', validate: Extraction.inSet(['gamma']), description: 'blah'}
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
      gamma: ['src/test/resources/html/screen.html', 'src/test/resources/routes.json', 'src/test/resources/test.file1', 'src/test/resources/tsconfig.sample.json'],
      delta: 'src/test/resources'
    },
    [
      {name: 'alpha', validate: Extraction.any, description: 'blah'},
      {name: 'beta', validate: Extraction.any, output: 'new.beta', description: 'blah'},
      {name: 'gamma', validate: Extraction.files(['']), description: 'blah'},
      {name: 'delta', validate: Extraction.directory, description: 'blah'}
    ],
    {
      alpha: 'Alpha',
      beta: 'Beta',
      gamma: 'src/test/resources',
      delta: 'src/test/resources'
    }
  );

  checkErrors(
    'Testing more than one definition, several fail, so the whole thing should return combined failures',
    [
      'Invalid value for property: alpha. Actual value: Alpha. Required value: one of ["a"]',
      '[test/resources.fake] is not a directory'
    ],
    [
      {name: 'alpha', validate: Extraction.inSet(['a']), description: 'blah'},
      {name: 'beta', validate: Extraction.any, output: 'new.beta', description: 'blah'},
      {name: 'gamma', validate: Extraction.files(['']), description: 'blah'},
      {name: 'delta', validate: Extraction.inSet(['Delta']), description: 'blah'},
      {name: 'epsilon', validate: Extraction.directory, description: 'blah'},
      {name: 'rho', validate: Extraction.any, description: 'blah'}
    ],
    {
      alpha: 'Alpha',
      beta: 'Beta',
      gamma: 'src/test/resources',
      delta: 'Delta',
      epsilon: 'test/resources.fake',
      rho: 'Rho'
    }
  );
});
