var { CheckerPlugin, TsConfigPathsPlugin } = require('awesome-typescript-loader');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var webpack = require("webpack");

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

let getWebPackConfig = function (scratchDir, scratchFile, dest) {
  return {
    context: path.resolve(__dirname),
    stats: 'none',
    entry: scratchFile,
    devtool: 'source-map',

    resolve: {
      extensions: ['.ts', '.js'],
      plugins: [
        new TsConfigPathsPlugin({
          options: {
            baseUrl: '.'
          }
        })
      ]
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          use: ['source-map-loader'],
          enforce: 'pre'
        },

        {
          test: /\.ts$/,
          use: [
            {
              loader: 'awesome-typescript-loader',
              options: {
                compiler: 'typescript',
                useCache: false,
                transpileOnly: true,
                cacheDirectory: path.join(scratchDir, 'awcache')
              }
            }
          ]
        },

        {
          test: /\.css$/,
          use: [ 'raw-loader' ]
        }
      ]
    },

    plugins: [
      new CheckerPlugin()
    ],

    output: {
      filename: path.basename(dest),
      path: path.dirname(dest)
    }
  };
};

let compile = function (webpackConfigFile, scratchDir, srcFiles, success) {
  var scratchFile = path.join(scratchDir, 'compiled/tests.ts');
  var dest = path.join(scratchDir, 'compiled/tests.js');

  mkdirp.sync(path.dirname(scratchFile));
  fs.writeFileSync(scratchFile, generateImports(scratchFile, srcFiles));

  webpack(getWebPackConfig(scratchDir, scratchFile, dest), (err, stats) => {
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
