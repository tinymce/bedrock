import * as path from 'path';
import * as fs from 'fs';
import * as Webpack from '../compiler/Webpack';

export const compile = (tsConfigFile: string, scratchDir: string, basedir: string, exitOnCompileError: boolean, files: string[], coverage: string[])  =>{
  const getCompileFunc = () => {
    return Webpack.compile;
  };

  const isTs = (filePath: string) => {
    const ext = path.extname(filePath);
    return ext === '.ts' || ext === '.tsx';
  };

  const tsFiles = files.filter(isTs);

  const generate = () => {
    return new Promise<Buffer | string>((resolve) => {
      const compile = getCompileFunc();
      if (tsFiles.length > 0) {
        compile(
          tsConfigFile,
          scratchDir,
          basedir,
          exitOnCompileError,
          tsFiles,
          coverage,
          (compiledJsFilePath) => {
            resolve(fs.readFileSync(compiledJsFilePath));
          }
        );
      } else {
        resolve('');
      }
    });
  };

  return {
    jsFiles: files.filter((filePath) => !isTs(filePath)),
    generate
  };
};
