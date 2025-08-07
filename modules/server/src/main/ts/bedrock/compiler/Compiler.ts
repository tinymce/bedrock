import * as fs from 'fs';
import * as Webpack from '../compiler/Webpack';
import * as BunCompiler from '../compiler/BunCompiler';

export interface Compiler {
  readonly generate: () => Promise<Buffer | string>;
}

export const compile = (tsConfigFile: string, scratchDir: string, basedir: string, exitOnCompileError: boolean, files: string[], coverage: string[], polyfills: string[], useTurbo?: boolean): Compiler => {
  const getCompileFunc = () => {
    // Check if we should use Bun compilation based on turbo flag, environment variable, or file presence
    const useBun = useTurbo || 
                   process.env.BEDROCK_USE_BUN === 'true' || 
                   process.env.BEDROCK_TURBO === 'true' ||
                   fs.existsSync('.bedrock-use-bun');
    
    if (useBun) {
      console.log('⚡ Using Bun for ultra-fast compilation!');
      return BunCompiler.compile;
    } else {
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
