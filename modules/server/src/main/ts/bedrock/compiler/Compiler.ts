import * as fs from 'fs';
import * as BunCompiler from '../compiler/BunCompiler';

export interface Compiler {
  readonly generate: () => Promise<Buffer | string>;
}

export const compile = (tsConfigFile: string, scratchDir: string, basedir: string, exitOnCompileError: boolean, files: string[], coverage: string[], polyfills: string[]): Compiler => {
  const getCompileFunc = () => {
    // Always use Bun compilation - no webpack fallback
    return BunCompiler.compile;
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
