import * as fs from 'fs';
import * as readdirSyncRec from 'recursive-readdir-sync';
import * as Attempt from '../core/Attempt';
import * as Qstring from '../util/Qstring';

export const file = function (name, rawValue) {
  // Ignore any query strings when checking if a file exists
  const parsed = Qstring.parse(rawValue);
  const value = parsed.base;
  try {
    fs.accessSync(value);
    if (!fs.statSync(value).isFile()) {
      return Attempt.failed('Property: ' + name + ' => Value: ' + value + ' was not a file');
    }
    return Attempt.passed(parsed.original);
  } catch (err) {
    return Attempt.failed(['Property [' + name + '] has value: [' + value + ']. This file does not exist']);
  }
};

export const inSet = function (candidates) {
  return function (name, value) {
    if (candidates.indexOf(value) === -1) {
      return Attempt.failed([
        'Invalid value for property: ' + name + '. Actual value: ' + value + '. Required value: one of ' + JSON.stringify(candidates)
      ]);
    } else {
      return Attempt.passed(value);
    }
  };
};

export const any = function (name, value) {
  return Attempt.passed(value);
};

export const directory = function (name, value) {
  try {
    if (! fs.lstatSync(value).isDirectory()) return Attempt.failed(['[' + value + '] is not a directory']);
    return Attempt.passed(value);
  } catch (err) {
    return Attempt.failed(['[' + value + '] is not a directory']);
  }
};

export const files = function (patterns) {
  return function (name, value) {
    const dir = directory(name, value);
    return Attempt.bind(dir, function (d) {
      try {
        const scanned = readdirSyncRec(d).filter(function (f) {
          const matches = patterns.filter(function (p) {
            return f.indexOf(p) > -1;
          });

          return matches.length > 0 && fs.lstatSync(f).isFile();
        });
        return Attempt.passed(scanned);
      } catch (err) {
        return Attempt.failed([
          'Error scanning directory [' + d + '] for files matching pattern: [' + patterns.join(', ') + ']'
        ]);
      }
    });
  };
};
