var path = require('path');
var fs = require('fs');
// var rollup = require('../compiler/rollup');
var webpack = require('../compiler/webpack');

module.exports = function (tsConfigFile, scratchDir, exitOnCompileError, files) {
  var getCompileFunc = function () {
    // return bundler === 'webpack' ? webpack.compile : rollup.compile;
    return webpack.compile;
  };

  var tsFiles = files.filter(function (filePath) {
    return path.extname(filePath) === '.ts';
  });

  var generate = function () {
    return new Promise((resolve) => {
      var compile = getCompileFunc();
      if (tsFiles.length > 0) {
        compile(
          tsConfigFile,
          scratchDir,
          exitOnCompileError,
          tsFiles,
          function (compiledJsFilePath) {
            resolve(fs.readFileSync(compiledJsFilePath))
          }
        );
      } else {
        resolve('');
      }
    });
  };

  return {
    jsFiles: files.filter(function (filePath) {
      return path.extname(filePath) !== '.ts';
    }),
    generate: generate
  };
};