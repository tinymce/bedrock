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
  readonly config: string;
  readonly coverage: string[];
  readonly polyfills: string[];
}

interface CompileInfo {
  readonly scratchFile: string;
  readonly dest: string;
  readonly config: webpack.Configuration;
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
    test: /\.(js|mjs|tsx?)$/,
    use: [ '@ephox/swag/webpack/remapper' ]
  }
] : [];

const webpackSharedRules = webpackRemap.concat([
  {
    test: /\.js$/,
    resolve: {
      fullySpecified: false
    }
  },
  {
    test: /\.(mjs)$/,
    type: 'javascript/auto',
    use: []
  },
  {
    test: /\.(js|mjs)$/,
    use: [ 'source-map-loader' ],
    enforce: 'pre'
  },
  {
    test: /\.(html|htm|css|bower|hex|rtf|xml|yml)$/,
    type: 'asset/source'
  },
  {
    resourceQuery: /raw/,
    type: 'asset/source'
  }
]);

const getWebPackConfigTs = (tsConfigFile: string, scratchFile: string, dest: string, coverage: string[], manualMode: boolean, basedir: string): webpack.Configuration => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const TsConfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

  const compilerOverrides = {
    rootDir: '.',
    declarationMap: false
  };

  return {
    stats: 'none',
    entry: scratchFile,
    devtool: 'source-map',
    mode: manualMode ? 'development' : 'none',
    target: [ 'web', 'es5' ],

    optimization: {
      usedExports: !manualMode
    },

    resolve: {
      extensions: [ '.ts', '.tsx', '.js', '.mjs' ],
      plugins: [
        new TsConfigPathsPlugin({
          configFile: tsConfigFile,
          // awesome-typescript-loader could read this from above, but the new plugin can't?
          // lol whatever
          extensions: [ '.ts', '.tsx', '.js', '.mjs' ]
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
      rules: webpackSharedRules.concat([
        {
          test: /\.(tsx?)$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                colors: manualMode,
                configFile: tsConfigFile,
                transpileOnly: true,
                projectReferences: true,
                compilerOptions: compilerOverrides
              }
            }
          ]
        }
      ]).concat(
        coverage ? [
          {
            test: /\.(tsx?)$/,
            enforce: 'post',
            loader: '@jsdevtools/coverage-istanbul-loader',
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
        async: manualMode,
        typescript: {
          memoryLimit: manualMode ? 4096 : 2048,
          configFile: tsConfigFile,
          build: true,
          configOverwrite: {
            compilerOptions: compilerOverrides
          }
        }
      }),
      // See https://github.com/TypeStrong/ts-loader#usage-with-webpack-watch
      new webpack.WatchIgnorePlugin({
        paths: [ /\.d\.ts$/ ]
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('development')
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
    devtool: 'source-map',
    mode: manualMode ? 'development' : 'none',
    target: [ 'web', 'es5' ],

    optimization: {
      usedExports: !manualMode
    },

    resolve: {
      extensions: [ '.js', '.mjs' ]
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
      rules: webpackSharedRules.concat(
        coverage ? [
          {
            test: /\.(js|mjs)$/,
            enforce: 'post',
            loader: '@jsdevtools/coverage-istanbul-loader',
            include: coverage.map((p) => path.resolve(p)),
            options: {
              esModules: true
            }
          }
        ] : []
      )
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('development')
      })
    ],
    output: {
      filename: path.basename(dest),
      path: path.resolve(path.dirname(dest))
    }
  };
};

const compileTests = (compileInfo: CompileInfo, exitOnCompileError: boolean, srcFiles: string[], polyfills: string[]): Promise<string> => {
  return new Promise((resolve) => {
    console.log(`Compiling ${srcFiles.length} tests...`);

    mkdirp.sync(path.dirname(compileInfo.scratchFile));
    fs.writeFileSync(compileInfo.scratchFile, Imports.generateImports(true, compileInfo.scratchFile, srcFiles, polyfills));

    webpack(compileInfo.config, (err, stats) => {
      if (err || stats && stats.hasErrors()) {
        const msg = err ?? stats?.toString({
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

const getJsCompileInfo = (scratchDir: string, basedir: string, manualMode: boolean, coverage: string[]): Promise<CompileInfo> => {
  const scratchFile = path.join(scratchDir, 'compiled/tests-imports.js');
  const dest = path.join(scratchDir, 'compiled/tests.js');
  const config = getWebPackConfigJs(scratchFile, dest, coverage, manualMode, basedir);

  return Promise.resolve({ scratchFile, dest, config });
};

const getCompileInfo = (tsConfigFile: string, scratchDir: string, basedir: string, manualMode: boolean, srcFiles: string[], coverage: string[]): Promise<CompileInfo> => {
  if (hasTs(srcFiles)) {
    return getTsCompileInfo(tsConfigFile, scratchDir, basedir, manualMode, coverage);
  } else {
    return getJsCompileInfo(scratchDir, basedir, manualMode, coverage);
  }
};

export const compile = async (tsConfigFile: string, scratchDir: string, basedir: string, exitOnCompileError: boolean, srcFiles: string[], coverage: string[], polyfills: string[]): Promise<string> => {
  const compileInfo = await getCompileInfo(tsConfigFile, scratchDir, basedir, false, srcFiles, coverage);
  return compileTests(compileInfo, exitOnCompileError, srcFiles, polyfills);
};

const isCompiledRequest = (request: { url: string }) => request.url.startsWith('/compiled/');

export const devserver = async (settings: WebpackServeSettings): Promise<Serve.ServeService> => {
  const scratchDir = path.resolve('scratch');
  const tsConfigFile = settings.config;

  const compileInfo = await getCompileInfo(tsConfigFile, scratchDir, settings.basedir, true, settings.testfiles, settings.coverage);
  return Serve.startCustom(settings, (handler) => {
    const scratchFile = compileInfo.scratchFile;
    console.log(`Loading ${settings.testfiles.length} tests...`);

    mkdirp.sync(path.dirname(scratchFile));
    fs.writeFileSync(scratchFile, Imports.generateImports(true, scratchFile, settings.testfiles, settings.polyfills));

    const compiler = webpack(compileInfo.config);

    // Prevents webpack from doing a recompilation of a change of tests.ts over and over
    compiler.hooks.emit.tap('bedrock', (compilation) => {
      compilation.fileDependencies.delete(scratchFile);
    });

    // Note: webpack-dev-server types don't work with v5, but the library itself does
    return new WebpackDevServer(compiler as any, {
      publicPath: '/compiled/',
      disableHostCheck: true,
      injectClient: true,
      headers: {
        'Cache-Control': 'public, max-age=0'  // Ensure compiled assets are re-validated
      },
      stats: {
        // copied from `'minimal'`
        // https://github.com/webpack/webpack/blob/v5.40.0/lib/stats/DefaultStatsPresetPlugin.js#L78
        all: false,
        version: false,
        timings: true,
        modules: true,
        modulesSpace: 0,
        assets: true,
        assetsSpace: 0,
        errors: true,
        errorsCount: true,
        warnings: true,
        warningsCount: true,
        logging: 'warn',

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
};
