var fs = require('fs');
var readdirSyncRec = require('recursive-readdir-sync');
var attempt = require('./attempt.js');

var file = function (name, value) {
  try {
    fs.accessSync(value);
    if (!fs.statSync(value).isFile()) throw new Error('Property: ' + name + ' => Value: ' + value + ' was not a file');
    return attempt.passed(value);
  } catch (err) {
    return attempt.failed({
      property: name,
      value: value,
      error: err,
      label: 'Property: ' + name + ' => Value: ' + value + ' was not a file or ' + err
    });
  }
};

var inSet = function (candidates) {
  return function (name, value) {
    if (candidates.indexOf(value) === -1) {
      return attempt.failed({
        property: name,
        value: value,
        error: 'custom',
        label: 'Invalid value for property: ' + name +
          '. Actual value: ' + value + '\nRequired value: one of ' + JSON.stringify(candidates)
      });
    } else {
      return attempt.passed(value);
    }
  };
};

var any = function (name, value) {
  return attempt.passed(value);
};

var files = function (pattern) {
  return function (name, value) {
    try {
      var scanned = readdirSyncRec(value).filter(function (f) {
        return f.indexOf(pattern) >-1 && fs.lstatSync(f).isFile();
      });
      return attempt.passed(scanned);
    } catch (err) {
      return attempt.failed({
        property: name,
        value: value,
        error: err,
        label: 'Scanning directory [' + value + '] for files matching pattern: [' + pattern + ']'
      });
    }
  };
};

module.exports = {
  file: file,
  inSet: inSet,
  any: any,
  files: files
};
