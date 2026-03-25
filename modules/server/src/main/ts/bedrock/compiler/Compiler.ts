import * as fs from 'fs';
import * as Webpack from '../compiler/Webpack';
import * as Rspack from '../compiler/Rspack';
import * as Types from './Types';

export interface Compiler {
  readonly generate: () => Promise<Buffer | string>;
}

export const compile = (args: Types.CompilerArgs): Compiler => {
  const {
    bundler,
    ...compileArgs
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
    const compiledJsFilePath = await compile(compileArgs);
    return fs.readFileSync(compiledJsFilePath);
  };

  return {
    generate
  };
};
