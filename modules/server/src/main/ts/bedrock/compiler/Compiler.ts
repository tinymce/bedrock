import * as fs from 'fs';
import * as Webpack from '../compiler/Webpack';

export const compile = (tsConfigFile: string, scratchDir: string, basedir: string, exitOnCompileError: boolean, files: string[], coverage: string[]) => {
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
      coverage
    ).then((compiledJsFilePath) => fs.readFileSync(compiledJsFilePath));
  };

  return {
    generate
  };
};
