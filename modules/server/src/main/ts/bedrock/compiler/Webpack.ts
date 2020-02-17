import * as ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import * as webpack from 'webpack';
import * as path from 'path';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as WebpackDevServer from 'webpack-dev-server';
import * as Serve from '../server/Serve';
import { ExitCodes } from '../util/ExitCodes';
import * as Imports from './Imports';
import { hasTs } from './TsUtils';

export interface WebpackServeSettings extends Serve.ServeSettings {
  config: string;
  coverage: string[];
}

interface CompileInfo {
  scratchFile: string;
  dest: string;
  config: webpack.Configuration;
}

const moduleAvailable = (name: string) => {
  try {
    require.resolve(name);
    return true;
  } catch (e) {
    return false;
  }
};

const webpackRemap: Array<Record<string, any>> = moduleAvailable('@ephox/swag') ? [
  {
    test: /\.js|\.tsx?$/,
    use: [ '@ephox/swag/webpack/remapper' ]
  }
] : [];

const getWebPackConfigTs = (tsConfigFile: string, scratchFile: string, dest: string, coverage: string[], manualMode: boolean, basedir: string): webpack.Configuration => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const TsConfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
  return {
    stats: 'none',
    entry: scratchFile,
    devtool: manualMode ? 'source-map' : false,
    mode: manualMode ? 'development' : 'none',

    optimization: {
      usedExports: !manualMode
    },

    resolve: {
      extensions: [ '.ts', '.tsx', '.js' ],
      plugins: [
        new TsConfigPathsPlugin({
          configFile: tsConfigFile,
          // awesome-typescript-loader could read this from above, but the new plugin can't?
          // lol whatever
          extensions: [ '.ts', '.tsx', '.js' ]
        })
      ]
    },

    // Webpack by default only resolves from the ./node_modules directory which will cause issues if the project that uses bedrock
    // doesn't also depend on the webpack loaders. So we need to add the path to the bedrock node_modules directory as well.
    resolveLoader: {
      modules: [
        path.join(basedir, 'node_modules'),
        'node_modules'
      ]
    },

    module: {
      rules: webpackRemap.concat([
        {
          test: /\.js$/,
          use: [ 'source-map-loader' ],
          enforce: 'pre'
        },

        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                colors: manualMode,
                configFile: tsConfigFile,
                transpileOnly: true,
                experimentalWatchApi: manualMode,
                onlyCompileBundledFiles: true,
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
      ]).concat(
        coverage ? [
          {
            test: /\.tsx?$/,
            enforce: 'post',
            loader: 'istanbul-instrumenter-loader',
            include: coverage.map((p) => path.resolve(p)),
            options: {
              esModules: true
            }
          }
        ] : []
      )
    },

    plugins: [
      new ForkTsCheckerWebpackPlugin({
        memoryLimit: manualMode ? 4096 : 2048,
        tsconfig: tsConfigFile,
        colors: manualMode,
        async: manualMode,
        useTypescriptIncrementalApi: manualMode,
        measureCompilationTime: true
      })
    ],

    output: {
      filename: path.basename(dest),
      path: path.resolve(path.dirname(dest))
    }
  };
};

const getWebPackConfigJs = (scratchFile: string, dest: string, coverage: string[], manualMode: boolean, basedir: string): webpack.Configuration => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return {
    stats: 'none',
    entry: scratchFile,
    devtool: manualMode ? 'source-map' : false,
    mode: manualMode ? 'development' : 'none',

    optimization: {
      usedExports: !manualMode
    },

    resolve: {
      extensions: [ '.js' ]
    },

    // Webpack by default only resolves from the ./node_modules directory which will cause issues if the project that uses bedrock
    // doesn't also depend on the webpack loaders. So we need to add the path to the bedrock node_modules directory as well.
    resolveLoader: {
      modules: [
        path.join(basedir, 'node_modules'),
        'node_modules'
      ]
    },

    module: {
      rules: webpackRemap.concat([
        {
          test: /\.js$/,
          use: [ 'source-map-loader' ],
          enforce: 'pre'
        },
        {
          test: /\.(html|htm|css|bower|hex|rtf|xml|yml)$/,
          use: [ 'raw-loader' ]
        }
      ]).concat(
        coverage ? [
          {
            test: /\.js?$/,
            enforce: 'post',
            loader: 'istanbul-instrumenter-loader',
            include: coverage.map((p) => path.resolve(p)),
            options: {
              esModules: true
            }
          }
        ] : []
      )
    },
    output: {
      filename: path.basename(dest),
      path: path.resolve(path.dirname(dest))
    }
  };
};

const compileTests = (compileInfo: CompileInfo, exitOnCompileError: boolean, srcFiles: string[]): Promise<string> => {
  return new Promise((resolve) => {
    console.log(`Compiling ${srcFiles.length} tests...`);

    mkdirp.sync(path.dirname(compileInfo.scratchFile));
    fs.writeFileSync(compileInfo.scratchFile, Imports.generateImports(true, compileInfo.scratchFile, srcFiles));

    webpack(compileInfo.config, (err, stats) => {
      if (err || stats.hasErrors()) {
        const msg = stats.toString({
          all: false,
          errors: true,
          moduleTrace: true,
          chunks: false,
          colors: false
        });

        console.log(msg);

        if (exitOnCompileError) {
          process.exit(ExitCodes.failures.error);
        }
      }

      resolve(compileInfo.dest);
    });
  });
};

const getTsCompileInfo = (tsConfigFile: string, scratchDir: string, basedir: string, manualMode: boolean, coverage: string[]): Promise<CompileInfo> => {
  return new Promise((resolve, reject) => {
    const scratchFile = path.join(scratchDir, 'compiled/tests-imports.ts');
    const dest = path.join(scratchDir, 'compiled/tests.js');

    if (!fs.existsSync(tsConfigFile)) {
      reject(`Could not find the required tsconfig file: ${tsConfigFile}`);
    } else {
      const config = getWebPackConfigTs(tsConfigFile, scratchFile, dest, coverage, manualMode, basedir);
      resolve({ scratchFile, dest, config });
    }
  });
};

const getJsCompileInfo = (scratchDir: string, basedir: string, coverage: string[]): Promise<CompileInfo> => {
  const scratchFile = path.join(scratchDir, 'compiled/tests-imports.js');
  const dest = path.join(scratchDir, 'compiled/tests.js');
  const config = getWebPackConfigJs(scratchFile, dest, coverage, false, basedir);

  return Promise.resolve({ scratchFile, dest, config });
};

const getCompileInfo = (tsConfigFile: string, scratchDir: string, basedir: string, manualMode: boolean, srcFiles: string[], coverage: string[]): Promise<CompileInfo> => {
  if (hasTs(srcFiles)) {
    return getTsCompileInfo(tsConfigFile, scratchDir, basedir, manualMode, coverage);
  } else {
    return getJsCompileInfo(scratchDir, basedir, coverage);
  }
};

export const compile = (tsConfigFile: string, scratchDir: string, basedir: string, exitOnCompileError: boolean, srcFiles: string[], coverage: string[]): Promise<string> => {
  return getCompileInfo(tsConfigFile, scratchDir, basedir, false, srcFiles, coverage)
    .then((compileInfo) => compileTests(compileInfo, exitOnCompileError, srcFiles))
};

const isCompiledRequest = (request: { url: string }) => request.url.startsWith('/compiled/');

export const devserver = (settings: WebpackServeSettings): Promise<Serve.ServeService> => {
  const scratchDir = path.resolve('scratch');
  const tsConfigFile = settings.config;

  return getCompileInfo(tsConfigFile, scratchDir, settings.basedir, true, settings.testfiles, settings.coverage)
    .then((compileInfo) => {
      return Serve.startCustom(settings, (handler) => {
        const scratchFile = compileInfo.scratchFile;
        console.log(`Loading ${settings.testfiles.length} tests...`);

        mkdirp.sync(path.dirname(scratchFile));
        fs.writeFileSync(scratchFile, Imports.generateImports(true, scratchFile, settings.testfiles));

        const compiler = webpack(compileInfo.config);

        // Prevents webpack from doing a recompilation of a change of tests.ts over and over
        compiler.hooks.emit.tap('bedrock', (compilation) => {
          compilation.fileDependencies.delete(scratchFile);
        });

        return new WebpackDevServer(compiler, {
          publicPath: '/compiled/',
          disableHostCheck: true,
          headers: {
            'Cache-Control': 'public, max-age=0'  // Ensure compiled assets are re-validated
          },
          stats: {
            // copied from `'minimal'`
            all: false,
            modules: true,
            maxModules: 0,
            errors: true,
            warnings: true,

            // suppress type re-export warnings caused by `transpileOnly: true`
            warningsFilter: /export .* was not found in/
          },
          before: (app) => {
            app.all('*', (request, response, next) => {
              return isCompiledRequest(request) ? next() : handler(request, response);
            });
          }
        });
      });
    });
};
