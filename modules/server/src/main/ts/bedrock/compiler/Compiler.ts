import * as fs from 'fs';
import * as Webpack from '../compiler/Webpack';
import * as Rspack from '../compiler/Rspack';

export interface Compiler {
  readonly generate: () => Promise<Buffer | string>;
}

export const compile = (bundler: 'webpack' | 'rspack', tsConfigFile: string, scratchDir: string, basedir: string, exitOnCompileError: boolean, files: string[], coverage: string[], polyfills: string[]): Compiler => {
  const getCompileFunc = () => {
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
