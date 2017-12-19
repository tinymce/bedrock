var { CheckerPlugin, TsConfigPathsPlugin } = require('awesome-typescript-loader');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var webpack = require("webpack");
var exitcodes = require('../util/exitcodes');
const imports = require('./imports');

let getWebPackConfig = function (tsConfigFile, scratchDir, scratchFile, dest) {
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
            configFileName: tsConfigFile
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
                configFileName: tsConfigFile,
                compiler: 'typescript',
                useCache: false,
                transpileOnly: false,
                cacheDirectory: path.join(scratchDir, 'awcache')
              }
            }
          ]
        },

        {
          test: /\.(html|htm|css|bower|hex|rtf)$/,
          use: [ 'raw-loader' ]
        }        
      ]
    },

    plugins: [
      new CheckerPlugin({})
    ],

    output: {
      filename: path.basename(dest),
      path: path.resolve(path.dirname(dest))
    }
  };
};

let compile = function (tsConfigFile, scratchDir, exitOnCompileError, srcFiles, success) {
  var scratchFile = path.join(scratchDir, 'compiled/tests.ts');
  var dest = path.join(scratchDir, 'compiled/tests.js');

  mkdirp.sync(path.dirname(scratchFile));
  fs.writeFileSync(scratchFile, imports.generateImports(true, scratchFile, srcFiles));

  webpack(getWebPackConfig(tsConfigFile, scratchDir, scratchFile, dest), (err, stats) => {
    if (err || stats.hasErrors()) {
      let msg = stats.toString({
        all: false,
        errors: true,
        moduleTrace: true,
        chunks: false,
        colors: true
      });

      console.log(msg);

      if (exitOnCompileError) {
        process.exit(exitcodes.failures.error);
      }
    }

    success(dest);
  });
};

module.exports = {
  compile: compile
};
