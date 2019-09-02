import * as rollup from 'rollup';
import * as typescript from 'rollup-plugin-typescript2';
import * as resolve from 'rollup-plugin-node-resolve';
import * as sourcemaps from 'rollup-plugin-sourcemaps';
import * as path from 'path';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as Imports from './Imports';
import * as ExitCodes from '../util/ExitCodes';

const parseTsConfig = function (tsconfig) {
  return JSON.parse(fs.readFileSync(tsconfig));
};

const compile = function (tsConfigFile, scratchDir, exitOnCompileError, srcFiles, success) {
  const scratchFile = path.join(scratchDir, 'compiled/tests.ts');
  const dest = path.join(scratchDir, 'compiled/tests.js');

  const outputOptions = {
    name: 'ephoxTests',
    file: dest,
    format: 'iife',
    sourcemap: true
  };

  const tsConfig = parseTsConfig(tsConfigFile);
  const include = tsConfig.include ? tsConfig.include : [];

  mkdirp.sync(path.dirname(scratchFile));
  fs.writeFileSync(scratchFile, Imports.generateImports(false, scratchFile, srcFiles));

  rollup.rollup({
    input: scratchFile,
    treeshake: false,
    plugins: [
      resolve({
        jsnext: true,
        customResolveOptions: {
          moduleDirectory: path.join(path.dirname(tsConfigFile), 'node_modules')
        }
      }),
      typescript({
        cacheRoot: path.join(scratchDir, 'rts2_cache'),
        tsconfig: tsConfigFile,
        verbosity: 2,
        check: false,
        // clean: true,
        tsconfigOverride: {
          compilerOptions: {
            declaration: false
          },
          include: include.concat([
            path.resolve(scratchFile)
          ])
        }
      }),
      sourcemaps()
    ]
  }).then(function (bundle) {
    bundle.generate(outputOptions);
    return bundle.write(outputOptions);
  }).then(function () {
    success(dest);
  }).catch(function (err) {
    console.log(err);

    if (exitOnCompileError) {
      process.exit(ExitCodes.failures.error);
    }

    success(dest);
  });
};

module.exports = {
  compile: compile
};
