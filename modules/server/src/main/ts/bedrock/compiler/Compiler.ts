import * as fs from 'fs';
import * as Webpack from '../compiler/Webpack.js';
import * as Rspack from '../compiler/Rspack.js';
import * as Types from './Types.js';

export interface Compiler {
  readonly generate: () => Promise<Buffer | string>;
}

export const compile = (args: { bundler: Types.Bundler; tsConfigFile: string; scratchDir: string; basedir: string; exitOnCompileError: boolean; files: string[]; coverage: string[]; polyfills: string[];
}): Compiler => {
  const {
    bundler,
    tsConfigFile,
    scratchDir,
    basedir,
    exitOnCompileError,
    files,
    coverage,
    polyfills
  } = args;

  const getCompileFunc = (): Types.CompileFn => {
    switch (bundler) {
      case 'rspack':
        return Rspack.compile;
      case 'webpack':
        return Webpack.compile;
    }
  };

  const generate = async (): Promise<Buffer | string> => {
    const compile = getCompileFunc();
    const compiledJsFilePath = await compile(
      tsConfigFile,
      scratchDir,
      basedir,
      exitOnCompileError,
      files,
      coverage,
      polyfills
    );
    return fs.readFileSync(compiledJsFilePath);
  };

  return {
    generate
  };
};
