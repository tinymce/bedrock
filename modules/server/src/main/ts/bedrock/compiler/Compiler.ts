import * as fs from 'fs';
import * as path from 'path';
import * as Webpack from '../compiler/Webpack';
import * as Rspack from '../compiler/Rspack';
import * as Types from './Types';

export interface Compiler {
  readonly generate: () => Promise<Buffer | string>;
}

export const compile = (args: { bundler: Types.Bundler; tsConfigFile: string; scratchDir: string; basedir: string; exitOnCompileError: boolean; files: string[]; coverage: string[]; polyfills: string[]; cache?: boolean
}): Compiler => {
  const {
    bundler,
    tsConfigFile,
    scratchDir,
    basedir,
    exitOnCompileError,
    files,
    coverage,
    polyfills,
    cache = false
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
    if (cache) {
      const compiled = path.join(scratchDir, 'compiled', 'tests.js');
      if (fs.existsSync(compiled)) {
        return fs.readFileSync(compiled);
      }
    }
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
