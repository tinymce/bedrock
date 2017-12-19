var { CheckerPlugin, TsConfigPathsPlugin } = require('awesome-typescript-loader');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var webpack = require("webpack");
const imports = require('./imports');

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
          test: /\.(html|htm|css|bower|hex|rtf)$/,
          use: [ 'raw-loader' ]
        }        
      ]
    },

    plugins: [
      new CheckerPlugin({
        silent: true
      })
    ],

    output: {
      filename: path.basename(dest),
      path: path.resolve(path.dirname(dest))
    }
  };
};

let compile = function (webpackConfigFile, scratchDir, srcFiles, success) {
  var scratchFile = path.join(scratchDir, 'compiled/tests.ts');
  var dest = path.join(scratchDir, 'compiled/tests.js');

  mkdirp.sync(path.dirname(scratchFile));
  fs.writeFileSync(scratchFile, imports.generateImports(true, scratchFile, srcFiles));

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
