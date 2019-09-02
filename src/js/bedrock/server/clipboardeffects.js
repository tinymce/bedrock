let childProcess = require('child_process');
var execSync = childProcess.execSync;
var path = require('path');

var exitcodes = require('../util/exitcodes');

/*
 JSON API for data: {
   import: "<file name>"
 }
 */
var importClipboard = function (basedir, clipboarddir, data) {
  var fileName = data.import;
  var fullPath = path.join(clipboarddir, fileName);
  var args = [
    path.join(basedir, 'bin/wink.exe'),
    '-i ' + fullPath
  ];

  var result = execSync(args.join(' '));
  if (result.length > 0) {
    console.error(result);
    process.exit(exitcodes.failures.wink);
  }

  return Promise.resolve({});
};

var route = function (basedir, clipboarddir) {
  return function (data) {
    return importClipboard(basedir, clipboarddir, data);
  };
};

module.exports = {
  route: route
};
