import * as BunCompiler from '../compiler/BunCompiler';

export interface Compiler {
  readonly generate: () => Promise<string>;
}

export const compile = (tsConfigFile: string, scratchDir: string, basedir: string, exitOnCompileError: boolean, files: string[], coverage: string[], polyfills: string[]): Compiler => {
  const getCompileFunc = () => {
    // Always use Bun compilation - no webpack fallback
    return BunCompiler.compile;
  };

  const generate = async (): Promise<string> => {
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
    // Return the file path instead of reading the content
    // The content will be read by the route handler when needed
    return compiledJsFilePath;
  };

  return {
    generate
  };
};
