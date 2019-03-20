const TsConfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var serve = require("../server/serve");
var exitcodes = require('../util/exitcodes');
var webpack = require("webpack");
const WebpackDevServer = require('webpack-dev-server');
const imports = require('./imports');

let getWebPackConfig = function (tsConfigFile, scratchFile, dest, coverage, manualMode) {
  return {
    stats: 'none',
    entry: scratchFile,
    devtool: manualMode ? 'source-map' : false,
    mode: manualMode ? 'development' : 'none',

    resolve: {
      extensions: ['.ts', '.js'],
      plugins: [
        new TsConfigPathsPlugin({
          configFile: tsConfigFile
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
              loader: 'ts-loader',
              options: {
                colors: false,
                configFile: tsConfigFile,
                transpileOnly: true,
                experimentalWatchApi: true,
                projectReferences: true,
                compilerOptions: {
                  rootDir: '.',
                  declarationMap: false
                }
              }
            }
          ]
        },

        {
          test: /\.(html|htm|css|bower|hex|rtf|xml|yml)$/,
          use: [ 'raw-loader' ]
        }
      ].concat(
        coverage ? [
          {
            test: /\.ts$/,
            enforce: 'post',
            loader: 'istanbul-instrumenter-loader',
            include: coverage.map((p) => path.resolve(p)),
            options: {
              esModules: true
            }
          },
        ] : []
      )
    },

    plugins: [
      new ForkTsCheckerWebpackPlugin({
        tsconfig: tsConfigFile,
        colors: manualMode,
        async: manualMode
      })
    ],

    output: {
      filename: path.basename(dest),
      path: path.resolve(path.dirname(dest))
    }
  };
};

let compile = function (tsConfigFile, scratchDir, exitOnCompileError, srcFiles, coverage, success) {
  var scratchFile = path.join(scratchDir, 'compiled/tests.ts');
  var dest = path.join(scratchDir, 'compiled/tests.js');

  mkdirp.sync(path.dirname(scratchFile));
  fs.writeFileSync(scratchFile, imports.generateImports(true, scratchFile, srcFiles));

  webpack(getWebPackConfig(tsConfigFile, scratchFile, dest, coverage, false), (err, stats) => {
    if (err || stats.hasErrors()) {
      let msg = stats.toString({
        all: false,
        errors: true,
        moduleTrace: true,
        chunks: false,
        colors: false
      });

      console.log(msg);

      if (exitOnCompileError) {
        process.exit(exitcodes.failures.error);
      }
    }

    success(dest);
  });
};

let isCompiledRequest = request => request.url.startsWith('/compiled/');

let devserver = function (settings, done) {
  return serve.startCustom(settings, function (handler) {
    var scratchDir = path.resolve('scratch');
    var scratchFile = path.join(scratchDir, 'compiled/tests.ts');
    var dest = path.join(scratchDir, 'compiled/tests.js');
    var tsConfigFile = settings.config;

    mkdirp.sync(path.dirname(scratchFile));
    fs.writeFileSync(scratchFile, imports.generateImports(true, scratchFile, settings.testfiles));

    const compiler = webpack(getWebPackConfig(tsConfigFile, scratchFile, dest, settings.coverage, true));

    // Prevents webpack from doing a recompilation of a change of tests.ts over and over
    compiler.hooks.emit.tap('bedrock', function (compilation) {
      compilation.fileDependencies.delete(scratchFile);
    });

    return new WebpackDevServer(compiler, {
      publicPath: '/compiled/',
      disableHostCheck: true,
      stats: 'minimal',
      before: function (app) {
        app.all('*', (request, response, next) => {
          return isCompiledRequest(request) ? next() : handler(request, response);
        });
      }
    });
  }, done);
};

module.exports = {
  compile: compile,
  devserver: devserver
};
