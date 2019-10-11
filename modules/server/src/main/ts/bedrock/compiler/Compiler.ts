import * as fs from 'fs';
import * as Webpack from '../compiler/Webpack';

export const compile = (tsConfigFile: string, scratchDir: string, basedir: string, exitOnCompileError: boolean, files: string[], coverage: string[]) => {
  const getCompileFunc = () => {
    return Webpack.compile;
  };

  const generate = () => {
    return new Promise<Buffer | string>((resolve) => {
      const compile = getCompileFunc();
      compile(
        tsConfigFile,
        scratchDir,
        basedir,
        exitOnCompileError,
        files,
        coverage,
        (compiledJsFilePath) => {
          resolve(fs.readFileSync(compiledJsFilePath));
        }
      );
    });
  };

  return {
    generate
  };
};
