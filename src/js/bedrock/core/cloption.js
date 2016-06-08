var fs = require('fs');
var readdirSyncRec = require('recursive-readdir-sync');

var validateFile = function (name, value) {
  try {
    fs.accessSync(value);
    if (!fs.statSync(value).isFile()) throw new Error('Property: ' + name + ' => Value: ' + value + ' was not a file');
    return value;
  } catch (err) {
    throw new Error('Property: ' + name + ' => Value: ' + value + ' was not a file or ' + err);
  }
};

var isOneOf = function (values) {
  return function (name, value) {
    if (values.indexOf(value) === -1) throw new Error(
      'Invalid value for property: ' + name +
      '. Actual value: ' + value + '\nRequired values: one of ' + JSON.stringify(values)
    );
    return value;
  };
};

var isAny = function (name, value) {
  return value;
};

var listDirectory = function (pattern) {
  return function (name, value) {
    return readdirSyncRec(value).filter(function (f) {
      return f.indexOf(pattern) >-1 && fs.lstatSync(f).isFile();
    });
  };
};

module.exports = {
  validateFile: validateFile,
  isAny: isAny,
  isOneOf: isOneOf,
  listDirectory: listDirectory
};
