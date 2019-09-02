const fs = require('fs');
const readdirSyncRec = require('recursive-readdir-sync');
const attempt = require('../core/Attempt');
const qstring = require('../util/Qstring');

const file = function (name, rawValue) {
  // Ignore any query strings when checking if a file exists
  const parsed = qstring.parse(rawValue);
  const value = parsed.base;
  try {
    fs.accessSync(value);
    if (!fs.statSync(value).isFile()) throw new Error('Property: ' + name + ' => Value: ' + value + ' was not a file');
    return attempt.passed(parsed.original);
  } catch (err) {
    return attempt.failed(['Property [' + name + '] has value: [' + value + ']. This file does not exist']);
  }
};

const inSet = function (candidates) {
  return function (name, value) {
    if (candidates.indexOf(value) === -1) {
      return attempt.failed([
        'Invalid value for property: ' + name + '. Actual value: ' + value + '. Required value: one of ' + JSON.stringify(candidates)
      ]);
    } else {
      return attempt.passed(value);
    }
  };
};

const any = function (name, value) {
  return attempt.passed(value);
};

const directory = function (name, value) {
  try {
    if (! fs.lstatSync(value).isDirectory()) return attempt.failed(['[' + value + '] is not a directory']);
    return attempt.passed(value);
  } catch (err) {
    return attempt.failed(['[' + value + '] is not a directory']);
  }
};

const files = function (patterns) {
  return function (name, value) {
    const dir = directory(name, value);
    return attempt.bind(dir, function (d) {
      try {
        const scanned = readdirSyncRec(d).filter(function (f) {
          const matches = patterns.filter(function (p) {
            return f.indexOf(p) > -1;
          });

          return matches.length > 0 && fs.lstatSync(f).isFile();
        });
        return attempt.passed(scanned);
      } catch (err) {
        return attempt.failed([
          'Error scanning directory [' + d + '] for files matching pattern: [' + patterns.join(', ') + ']'
        ]);
      }
    });
  };
};

module.exports = {
  file: file,
  inSet: inSet,
  any: any,
  files: files,
  directory: directory
};
