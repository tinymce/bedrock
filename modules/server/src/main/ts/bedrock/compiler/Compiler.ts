import * as BunCompiler from '../compiler/BunCompiler';
import * as Webpack from '../compiler/Webpack';
import * as fs from 'fs';
import * as path from 'path';

export interface Compiler {
  readonly generate: () => Promise<string>;
}

export const compile = (tsConfigFile: string, scratchDir: string, basedir: string, exitOnCompileError: boolean, files: string[], coverage: string[], polyfills: string[], turbo?: boolean): Compiler => {
  const shouldUseBun = (): boolean => {
    // Check --turbo flag first
    if (turbo === true) {
      return true;
    }
    if (turbo === false) {
      return false;
    }

    // Check BEDROCK_USE_BUN environment variable
    if (process.env.BEDROCK_USE_BUN === 'true') {
      return true;
    }
    if (process.env.BEDROCK_USE_BUN === 'false') {
      return false;
    }

    // Check BEDROCK_TURBO environment variable
    if (process.env.BEDROCK_TURBO === 'true') {
      return true;
    }
    if (process.env.BEDROCK_TURBO === 'false') {
      return false;
    }

    // Check for .bedrock-use-bun file in project directory
    try {
      const bunFlagFile = path.join(path.dirname(tsConfigFile), '.bedrock-use-bun');
      if (fs.existsSync(bunFlagFile)) {
        return true;
      }
    } catch (error) {
      // Ignore file system errors
    }

    // Default to webpack
    return false;
  };

  const getCompileFunc = () => {
    if (shouldUseBun()) {
      console.log('Using Bun compilation (turbo mode)');
      return BunCompiler.compile;
    } else {
      console.log('Using Webpack compilation (default mode)');
      return Webpack.compile;
    }
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
