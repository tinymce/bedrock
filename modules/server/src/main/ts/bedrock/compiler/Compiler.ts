import * as fs from 'fs';
import * as Rspack from '../compiler/Rspack';
import * as Types from './Types';

export interface Compiler {
  readonly generate: () => Promise<Buffer | string>;
}

export const compile = (args: Types.CompileArgs): Compiler => {
  const generate = async (): Promise<Buffer | string> => {
    const compiledJsFilePath = await Rspack.compile(args);
    return fs.readFileSync(compiledJsFilePath);
  };

  return {
    generate
  };
};
