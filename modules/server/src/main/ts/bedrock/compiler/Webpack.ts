import * as webpack from 'webpack';
import * as path from 'path';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as WebpackDevServer from 'webpack-dev-server';
import * as Serve from '../server/Serve';
import { ExitCodes } from '../util/ExitCodes';
import * as Imports from './Imports';
import { hasTs } from './TsUtils';
import * as esbuild from 'esbuild';
import * as http from 'http';

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
]);

const getWebPackConfigTs = (tsConfigFile: string, scratchFile: string, dest: string, coverage: string[], manualMode: boolean, basedir: string): webpack.Configuration => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const TsConfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

  return {
    stats: 'none',
    entry: scratchFile,
    devtool: manualMode ? 'inline-source-map' : 'source-map',
    mode: manualMode ? 'development' : 'none',
    target: [ 'web', 'es5' ],

    optimization: {
      usedExports: !manualMode
    },

    ignoreWarnings: [
      // suppress type re-export warnings caused by `transpileOnly: true`
      // See https://github.com/TypeStrong/ts-loader#transpileonly
      /export .* was not found in/
    ],

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
                projectReferences: true
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
          build: true
        }
      }),
      new webpack.WatchIgnorePlugin({
        paths: [
          // Ignore generated files. See https://github.com/TypeStrong/ts-loader#usage-with-webpack-watch
          /\.d\.ts$/,
          /\.(js|ts)\.map$/,
          // Something seems to trigger that node module package.json files change when they
          // haven't, so lets just ignore them entirely
          /node_modules\/.*\/package\.json$/
        ]
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

const isCompiledRequest = (request: { url?: string }) => request.url === '/compiled/tests.js';
const isCompiledMapRequest = (request: { url?: string }) => request.url === '/compiled/tests.js.map';

const resolveImport = (source: string, modulePath: string): string | null => {
  try {
      return require.resolve(modulePath, { paths: [ source ] });
  } catch (_) {
    return null;
  }
};

export const devserver = async (settings: WebpackServeSettings): Promise<Serve.ServeService> => {
  const scratchDir = path.resolve('scratch');
  const tsConfigFile = settings.config;

  const compileInfo = await getCompileInfo(tsConfigFile, scratchDir, settings.basedir, true, settings.testfiles, settings.coverage);
  return Serve.startCustom(settings, (port, handler) => {
    const scratchFile = compileInfo.scratchFile;
    console.log(`Loading ${settings.testfiles.length} test files...`);
    const clients: http.ServerResponse<http.IncomingMessage>[] = [];
    const cache = new Map<string, string>();
    const outfile = path.join(scratchDir, '/compiled/tests.js');

    mkdirp.sync(path.dirname(scratchFile));
    fs.writeFileSync(scratchFile, Imports.generateImports(false, scratchFile, settings.testfiles, []));

    const bedrockPlugin: esbuild.Plugin = {
      name: 'bedrock',
      setup(build) {
        let last = Date.now();
        build.onStart(() => {
          last = Date.now();
        });
        build.onEnd(() => {
          console.log(`Esbuild build took ${Date.now() - last}ms`);
          clients.forEach((res) => res.write('data: reload\n\n'));
          clients.length = 0;
        });
        build.onResolve({ filter: /^@ephox\/[^\/]+$/ }, (args) => {
          // This is needed for esbuild to detect changes in TS files from package imports to for example '@ephox/alloy'
          // This might need to be smarted by parsing the tsconfig files to resolve paths or us typescript module resolver

          // This is called a ton of times everytime you use katamari so we need to cache it
          const cachedAbsPath = cache.get(args.path);
          if (cachedAbsPath) {
            return { path: cachedAbsPath };
          }

          // Resolve package names like `@ephox/something` to an absolute path to `api/Main.ts`
          const packageJsonPath = resolveImport(args.resolveDir, path.join(args.path, 'package.json'));
          if (packageJsonPath) {
            const name = path.basename(args.path);
            const tryPaths = [ `src/main/ts/ephox/${name}/api/Main.ts`, 'src/main/ts/api/Main.ts' ];
            for (const tryPath of tryPaths) {
              const absTryPath = path.join(path.dirname(packageJsonPath), tryPath);
              if (fs.existsSync(absTryPath)) {
                cache.set(args.path, absTryPath);
                return { path: absTryPath };
              }
            }
          }
        });
      },
    };

    const setupEsBuild = async () => {
      const ctx = await esbuild.context({
        entryPoints: [scratchFile],
        footer: { js: ' (() => new EventSource("/esbuild").onmessage = () => location.reload())();' }, 
        bundle: true,
        sourcemap: 'linked',
        outfile,
        loader: {
          '.svg': 'dataurl' // Silver theme imports svg files
        },
        plugins: [ bedrockPlugin ]
      });

      await ctx.watch();
    };

    const server = http.createServer((req, res) => {
      if (isCompiledRequest(req)) {
        res.writeHead(200, {
          'Content-Type': 'text/javascript'
        });

        fs.createReadStream(outfile).pipe(res);
      } else if (isCompiledMapRequest(req)) {
        res.writeHead(200, {
          'Content-Type': 'application/json'
        });

        fs.createReadStream(outfile + '.map').pipe(res);
      } else if (req.url === '/esbuild') {
        clients.push(res);
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });
      } else {
        handler(req, res);
      }
    });
    return {
      start: async () => {
        await setupEsBuild();

        return new Promise((resolve) => {
          server.listen(port, resolve);
        });
      },
      stop: () => new Promise((resolve, reject) => {
        server.close((err?) => {
          err ? reject(err) : resolve();
        });
      })
    };
  });
};

export const devserverWebpack = async (settings: WebpackServeSettings): Promise<Serve.ServeService> => {
  const scratchDir = path.resolve('scratch');
  const tsConfigFile = settings.config;

  const compileInfo = await getCompileInfo(tsConfigFile, scratchDir, settings.basedir, true, settings.testfiles, settings.coverage);
  return Serve.startCustom(settings, (port, handler) => {
    const scratchFile = compileInfo.scratchFile;
    console.log(`Loading ${settings.testfiles.length} test files...`);

    mkdirp.sync(path.dirname(scratchFile));
    fs.writeFileSync(scratchFile, Imports.generateImports(true, scratchFile, settings.testfiles, settings.polyfills));

    const compiler = webpack({
      infrastructureLogging: { level: 'warn' },
      ...compileInfo.config
    });

    // Prevents webpack from doing a recompilation of a change of tests.ts over and over
    compiler.hooks.emit.tap('bedrock', (compilation) => {
      compilation.fileDependencies.delete(scratchFile);
    });

    const server = new WebpackDevServer({
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
      magicHtml: false,
      setupMiddlewares: (middlewares) => {
        const bedrockHandler: WebpackDevServer.RequestHandler = (request, response, next) => {
          return isCompiledRequest(request) ? next() : handler(request, response);
        };
        return [
          { name: 'bedrock', middleware: bedrockHandler },
          ...middlewares
        ];
      }
    }, compiler);

    return {
      start: () => server.start(),
      stop: () => server.stop()
    };
  });
};
