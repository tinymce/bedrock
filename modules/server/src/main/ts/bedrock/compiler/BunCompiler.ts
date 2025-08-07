import * as Webpack from './Webpack';

// TODO: Add nx affected project functionality here in the future

/**
 * Use the existing proven Webpack implementation, now enhanced with React→Preact aliasing
 * This is the most reliable approach - use what already works!
 */
export const compile = async (tsConfigFile: string, scratchDir: string, basedir: string, exitOnCompileError: boolean, srcFiles: string[], coverage: string[], polyfills: string[]): Promise<string> => {
  console.log(`⚡ Enhanced webpack compiling ${srcFiles.length} tests with React→Preact aliasing...`);
  
  // Use the original proven webpack implementation, which now includes React→Preact aliasing
  return Webpack.compile(tsConfigFile, scratchDir, basedir, exitOnCompileError, srcFiles, coverage, polyfills);
};