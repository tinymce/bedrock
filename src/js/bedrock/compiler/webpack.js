var { CheckerPlugin, TsConfigPathsPlugin } = require('awesome-typescript-loader');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var webpack = require("webpack");

let extend = function (a, b) {
  let c = {};

  for (let k in a) {
    if (a.hasOwnProperty(k)) {
      c[k] = a[k];
    }
  }

  for (let k in b) {
    if (b.hasOwnProperty(k)) {
      c[k] = b[k];
    }
  }

  return c;
};

let generateImports = function (scratchFile, srcFiles) {
  var imports = srcFiles.map(function (filePath) {
    var importFilePath = path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)));

    return [
      'import "' + path.relative(path.dirname(scratchFile), importFilePath) + '";'
    ].join('\n');
  }).join('\n');

  var filePaths = srcFiles.map(function (filePath) {
    return '"' + filePath + '"';
  }).join(', ');

  return [
    imports,
    'declare let window: any;',
    'window.__testFiles = [' + filePaths + '];'
  ].join('\n');
};

let compile = function (webpackConfigFile, scratchDir, srcFiles, success) {
  var scratchFile = path.join(scratchDir, 'tests.ts');
  var dest = path.join(scratchDir, 'tests.js');
  var webPackConfig = require(webpackConfigFile);

  mkdirp.sync(path.dirname(scratchFile));
  fs.writeFileSync(scratchFile, generateImports(scratchFile, srcFiles));

  webpack(extend(webPackConfig, {
    stats: 'none',
    entry: scratchFile,
    output: {
      filename: path.basename(dest),
      path: path.dirname(dest)
    }
  }), (err, stats) => {
    if (err || stats.hasErrors()) {
      console.log(stats.toString({
        all: false,
        errors: true,
        moduleTrace: true,
        chunks: false,
        colors: true
      }));
    }

    success(dest);
  });
};

module.exports = {
  compile: compile
};
