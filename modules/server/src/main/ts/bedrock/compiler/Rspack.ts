import * as path from 'path';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as Serve from '../server/Serve';
import { ExitCodes } from '../util/ExitCodes';
import * as Imports from './Imports';
import { rspack, RspackOptions, DevServerMiddlewareHandler } from '@rspack/core';
import { RspackDevServer } from '@rspack/dev-server';
import { RspackCompileInfo, DevServerServeSettings, CompileFn } from './Types';

const getTsCheckerOptions = (tsConfigFile: string, manualMode: boolean): Record<string, unknown> => {
  const options: Record<string, unknown> = {
    memoryLimit: manualMode ? 4096 : 2048,
    configFile: tsConfigFile,
    build: true
  };

  // TypeScript 7 is the native compiler and no longer ships the JavaScript API that the
  // checker uses, so from 7 onwards it has to run in tsgo mode against the package itself.
  // Resolve from the project being tested so bedrock keeps working for consumers on older
  // TypeScript versions.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const typescriptPath = require.resolve('typescript/package.json', { paths: [ process.cwd() ] });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const version: string = require(typescriptPath).version;
    if (parseInt(version.split('.')[0], 10) >= 7) {
      options.tsgo = true;
      options.typescriptPath = typescriptPath;
    }
  } catch {
    // Leave the checker to resolve TypeScript itself
  }

  return options;
};

const getRspackConfigTs = (tsConfigFile: string, scratchFile: string, dest: string, manualMode: boolean, basedir: string, skipTypecheck: boolean): RspackOptions => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { TsCheckerRspackPlugin } = require('ts-checker-rspack-plugin');

   const getTsConfigFile = () => path.isAbsolute(tsConfigFile) ? tsConfigFile : path.resolve(process.cwd(), tsConfigFile);

  return {
    entry: scratchFile,
    devtool: manualMode ? 'inline-source-map' : false,
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
      // Fall back to bedrock's own node_modules so the polyfills bedrock injects (core-js)
      // resolve even when the project under test doesn't depend on them, and regardless of
      // whether the package manager hoists them. The project's own modules still win.
      modules: [
        'node_modules',
        path.join(basedir, 'node_modules')
      ],
      alias: {
        // https://github.com/rspack-contrib/rstack-examples/blob/main/rspack/preact/rspack.config.js
        react: 'preact/compat',
        'react-dom/test-utils': 'preact/test-utils',
        'react-dom': 'preact/compat', // Must be below test-utils
        'react/jsx-runtime': 'preact/jsx-runtime',
      }
    },

    // Rspack by default only resolves from the ./node_modules directory which will cause issues if the project that uses bedrock
    // doesn't also depend on the rspack loaders. So we need to add the path to the bedrock node_modules directory as well.
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
              target: 'es2022',
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
      ...(!skipTypecheck ? [ new TsCheckerRspackPlugin({
        async: manualMode,
        typescript: getTsCheckerOptions(getTsConfigFile(), manualMode)
      }) ] : [])
    ],

    output: {
      filename: path.basename(dest),
      path: path.resolve(path.dirname(dest))
    }
  };
};

const compileTests = (compileInfo: RspackCompileInfo, exitOnCompileError: boolean, srcFiles: string[], polyfills: string[]): Promise<string> => {
  return new Promise((resolve) => {
    console.log(`Compiling ${srcFiles.length} tests...`);
    const start = Date.now();

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

      console.log(`Compiled ${srcFiles.length} tests in ${Date.now() - start}ms`);
      resolve(compileInfo.dest);
    });
  });
};

const getTsCompileInfo = (tsConfigFile: string, scratchDir: string, basedir: string, manualMode: boolean, skipTypecheck: boolean): Promise<RspackCompileInfo> => {
  return new Promise((resolve, reject) => {
    const scratchFile = path.join(scratchDir, 'compiled/tests-imports.ts');
    const dest = path.join(scratchDir, 'compiled/tests.js');

    if (!fs.existsSync(tsConfigFile)) {
      reject(`Could not find the required tsconfig file: ${tsConfigFile}`);
    } else {
      const config = getRspackConfigTs(tsConfigFile, scratchFile, dest, manualMode, basedir, skipTypecheck);
      resolve({ scratchFile, dest, config });
    }
  });
};

const getCompileInfo = (tsConfigFile: string, scratchDir: string, basedir: string, manualMode: boolean, skipTypecheck: boolean): Promise<RspackCompileInfo> => {
  return getTsCompileInfo(tsConfigFile, scratchDir, basedir, manualMode, skipTypecheck);
};

export const compile: CompileFn = async ({
  tsConfigFile,
  scratchDir,
  basedir,
  exitOnCompileError,
  srcFiles,
  polyfills,
  skipTypecheck
}): Promise<string> => {
  const compileInfo = await getCompileInfo(tsConfigFile, scratchDir, basedir, false, skipTypecheck);
  return compileTests(compileInfo, exitOnCompileError, srcFiles, polyfills);
};

const isCompiledRequest = (url?: string) => url && url.startsWith('/compiled/');

export const devserver = async (settings: DevServerServeSettings): Promise<Serve.ServeService> => {
  const scratchDir = path.resolve('scratch');
  const tsConfigFile = settings.config;
  const skipTypecheck = settings.skipTypecheck;

  const compileInfo = await getCompileInfo(tsConfigFile, scratchDir, settings.basedir, true, skipTypecheck);
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
        const bedrockMiddleware: DevServerMiddlewareHandler = (req, res, next) => {
          return isCompiledRequest(req.url) ? next() : handler(req, res);
        };
        return [
          { name: 'bedrock', middleware: bedrockMiddleware },
          ...middlewares
        ];
      }
    }, compiler);

    return {
      start: async () => {
        await (server as any).start();
        return port;
      },
      stop: () => (server as any).stop()
    };
  });
};
