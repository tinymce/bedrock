var fs = require('fs');
var readdirSyncRec = require('recursive-readdir-sync');
var attempt = require('../core/attempt');

var qstring = require('../util/qstring');

var file = function (name, rawValue) {
  // Ignore any query strings when checking if a file exists
  var parsed = qstring.parse(rawValue);
  var value = parsed.base;
  try {
    fs.accessSync(value);
    if (!fs.statSync(value).isFile()) throw new Error('Property: ' + name + ' => Value: ' + value + ' was not a file');
    return attempt.passed(parsed.original);
  } catch (err) {
    return attempt.failed([ 'Property [' + name + '] has value: [' + value + ']. This file does not exist' ]);
  }
};

var inSet = function (candidates) {
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

var any = function (name, value) {
  return attempt.passed(value);
};

var directory = function (name, value) {
  try {
    if (! fs.lstatSync(value).isDirectory()) return attempt.failed([ '[' + value + '] is not a directory' ]);
    return attempt.passed(value);
  } catch (err) {
    return attempt.failed([ '[' + value + '] is not a directory' ]);
  }
};

var files = function (patterns) {
  return function (name, value) {
    var dir = directory(name, value);
    return attempt.bind(dir, function (d) {
      try {
        var scanned = readdirSyncRec(d).filter(function (f) {
          var matches = patterns.filter(function (p) {
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
