import * as path from 'path';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as Serve from '../server/Serve';
import { ExitCodes } from '../util/ExitCodes';
import * as Imports from './Imports';
import { rspack, RspackOptions } from '@rspack/core';
import { RspackDevServer } from '@rspack/dev-server';
import { RspackCompileInfo, DevServerServeSettings } from './Types';

const getWebPackConfigTs = (tsConfigFile: string, scratchFile: string, dest: string, manualMode: boolean, basedir: string): RspackOptions => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { TsCheckerRspackPlugin } = require('ts-checker-rspack-plugin');

   const getTsConfigFile = () => path.isAbsolute(tsConfigFile) ? tsConfigFile : path.resolve(process.cwd(), tsConfigFile);
  console.log(`Using tsconfig file: ${getTsConfigFile()}`);

  return {
    entry: scratchFile,
    devtool: manualMode ? 'inline-source-map' : 'source-map',
    mode: manualMode ? 'development' : 'none',
    target: ['web', 'es5'],

    optimization: {
      usedExports: !manualMode
    },

    ignoreWarnings: [
      // suppress type re-export warnings caused by `transpileOnly: true`
      // See https://github.com/TypeStrong/ts-loader#transpileonly
      /export .* was not found in/
    ],

    resolve: {
      conditionNames: [ 'tiny:source', '...' ],
      extensions: ['.ts', '.tsx', '.js', '.mjs'],
      tsConfig: getTsConfigFile(),
      alias: {
        // https://github.com/rspack-contrib/rstack-examples/blob/main/rspack/preact/rspack.config.js
        react: 'preact/compat',
        'react-dom/test-utils': 'preact/test-utils',
        'react-dom': 'preact/compat', // Must be below test-utils
        'react/jsx-runtime': 'preact/jsx-runtime',
      }
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
      rules: [
        {
          test: /\.(tsx?)$/,
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: { syntax: 'typescript', tsx: true },
              transform: {
                react: {
                  runtime: 'automatic',
                },
              },
            },
            sourceMaps: manualMode ? 'inline' : true
          }
        },
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
          use: ['source-map-loader'],
          enforce: 'pre'
        },
        {
          test: /\.(html|htm|css|bower|hex|rtf|xml|yml|svg)$/i,
          type: 'asset/source'
        },
        {
          test: /\.(jpe?g|png|gif|apng|avif|webp|bmp|tiff)$/i,
          type: 'asset/inline'
        },
        {
          resourceQuery: /raw/,
          type: 'asset/source'
        }
      ]
    },

    plugins: [
      new rspack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('development')
      }),
      new TsCheckerRspackPlugin({
        async: manualMode,
        typescript: {
          memoryLimit: manualMode ? 4096 : 2048,
          configFile: getTsConfigFile(),
          build: true
        }
      })
    ],

    output: {
      filename: path.basename(dest),
      path: path.resolve(path.dirname(dest))
    }
  };
};

const compileTests = (compileInfo: RspackCompileInfo, exitOnCompileError: boolean, srcFiles: string[], polyfills: string[]): Promise<string> => {
  return new Promise((resolve) => {

    mkdirp.sync(path.dirname(compileInfo.scratchFile));
    fs.writeFileSync(compileInfo.scratchFile, Imports.generateImports(true, compileInfo.scratchFile, srcFiles, polyfills));

    rspack(compileInfo.config, (err, stats) => {
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

const getTsCompileInfo = (tsConfigFile: string, scratchDir: string, basedir: string, manualMode: boolean): Promise<RspackCompileInfo> => {
  return new Promise((resolve, reject) => {
    const scratchFile = path.join(scratchDir, 'compiled/tests-imports.ts');
    const dest = path.join(scratchDir, 'compiled/tests.js');

    if (!fs.existsSync(tsConfigFile)) {
      reject(`Could not find the required tsconfig file: ${tsConfigFile}`);
    } else {
      const config = getWebPackConfigTs(tsConfigFile, scratchFile, dest, manualMode, basedir);
      resolve({ scratchFile, dest, config });
    }
  });
};

const getCompileInfo = (tsConfigFile: string, scratchDir: string, basedir: string, manualMode: boolean): Promise<RspackCompileInfo> => {
  return getTsCompileInfo(tsConfigFile, scratchDir, basedir, manualMode);
};

export const compile = async (tsConfigFile: string, scratchDir: string, basedir: string, exitOnCompileError: boolean, srcFiles: string[], polyfills: string[]): Promise<string> => {
  const compileInfo = await getCompileInfo(tsConfigFile, scratchDir, basedir, false);
  return compileTests(compileInfo, exitOnCompileError, srcFiles, polyfills);
};

const isCompiledRequest = (url?: string) => url && url.startsWith('/compiled/');

export const devserver = async (settings: DevServerServeSettings): Promise<Serve.ServeService> => {
  const scratchDir = path.resolve('scratch');
  const tsConfigFile = settings.config;

  const compileInfo = await getCompileInfo(tsConfigFile, scratchDir, settings.basedir, true);
  return Serve.startCustom(settings, (port, handler) => {
    const scratchFile = compileInfo.scratchFile;
    console.log(`Loading ${settings.testfiles.length} test files...`);

    mkdirp.sync(path.dirname(scratchFile));
    fs.writeFileSync(scratchFile, Imports.generateImports(true, scratchFile, settings.testfiles, settings.polyfills));

    const compiler = rspack({
      infrastructureLogging: { level: 'warn' },
      watchOptions: {
        ignored: [scratchFile],
      },
      ...compileInfo.config
    });

    const server = new RspackDevServer({
      port,
      allowedHosts: 'all',
      hot: false,
      setupExitSignals: false,
      headers: {
        'Cache-Control': 'public, max-age=0'  // Ensure compiled assets are re-validated
      },
      devMiddleware: {
        publicPath: '/compiled/',
        stats: {
          // copied from `'minimal'` and disabled assets
          // https://github.com/webpack/webpack/blob/v5.40.0/lib/stats/DefaultStatsPresetPlugin.js#L78
          all: false,
          version: false,
          timings: true,
          modules: true,
          modulesSpace: 0,
          assets: false,
          assetsSpace: 0,
          errors: true,
          errorsCount: true,
          warnings: true,
          warningsCount: true,
          logging: 'warn'
        }
      },
      // Static content is handled via the bedrock middleware below
      static: false,
      setupMiddlewares: (middlewares) => {
        return [
          {
            name: 'bedrock', middleware: (req, res, next) => {
              return isCompiledRequest(req.url) ? next() : handler(req, res);
            }
          },
          ...middlewares
        ];
      }
    }, compiler);

    return {
      start: () => (server as any).start(),
      stop: () => (server as any).stop()
    };
  });
};
