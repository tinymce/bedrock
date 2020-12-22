import * as fs from 'fs';
import * as Webpack from '../compiler/Webpack';

export interface Compiler {
  readonly generate: () => Promise<Buffer | string>;
}

export const compile = (tsConfigFile: string, scratchDir: string, basedir: string, exitOnCompileError: boolean, files: string[], coverage: string[], polyfills: string[]): Compiler => {
  const getCompileFunc = () => {
    return Webpack.compile;
  };

  const generate = (): Promise<Buffer | string> => {
    const compile = getCompileFunc();
    return compile(
      tsConfigFile,
      scratchDir,
      basedir,
      exitOnCompileError,
      files,
      coverage,
      polyfills
    ).then((compiledJsFilePath) => fs.readFileSync(compiledJsFilePath));
  };

  return {
    generate
  };
};
