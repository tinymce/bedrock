import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import { spawnSync } from 'child_process';
import * as Imports from './Imports';

/**
 * Creates a React alias resolver for Bun build
 */
const createReactAliasResolver = (module: string, target: string) => `
  build.onResolve({ filter: /^${module.replace('/', '\\/')}$/ }, () => {
    try {
      const resolvedPath = require.resolve('${target}', resolveOptions);
      return { path: resolvedPath };
    } catch (e) {
      console.warn('Failed to resolve ${target} for ${module} alias:', e.message);
      return null;
    }
  });`;

/**
 * Generates the Bun build script with React → Preact aliasing
 */
/**
 * Check if Bun is available in the system
 */
const isBunAvailable = (): boolean => {
  try {
    const result = spawnSync('bun', ['--version'], { stdio: 'pipe', timeout: 5000 });
    return result.status === 0;
  } catch (error) {
    return false;
  }
};

/**
 * Generates the Bun build script with React → Preact aliasing
 */
const generateBunBuildScript = (scratchFile: string, dest: string): string => `
import { plugin } from 'bun';

const reactAliasPlugin = {
  name: 'react-alias',
  setup(build) {
    const resolveOptions = { paths: ['${process.cwd()}'] };
    ${createReactAliasResolver('react', 'preact/compat')}
    ${createReactAliasResolver('react-dom', 'preact/compat')}
    ${createReactAliasResolver('react/jsx-runtime', 'preact/jsx-runtime')}
  }
};

const result = await Bun.build({
  entrypoints: ['${scratchFile.replace(/\\/g, '/')}'],
  outdir: '${path.dirname(dest).replace(/\\/g, '/')}',
  target: 'browser',
  format: 'iife',
  sourcemap: 'external',
  plugins: [reactAliasPlugin],
  define: {
    'process.env.NODE_ENV': '"development"',
    'global': 'globalThis'
  },
  splitting: false,
  minify: false
});

if (!result.success) {
  throw new Error('Bun build failed: ' + result.logs.map(log => log.message).join(', '));
}

// Move the output to the expected location
const fs = require('fs');
const path = require('path');

// Find the generated file - Bun will output with a default name
const outputDir = '${path.dirname(dest)}';
const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.js') && !f.endsWith('.map'));
if (files.length > 0) {
  const generatedFile = path.join(outputDir, files[0]);
  fs.renameSync(generatedFile, '${dest}');
}
`;

/**
 * Real Bun compiler implementation
 * Compiles TypeScript tests to browser-compatible JavaScript using Bun CLI
 */
export const compile = async (
  tsConfigFile: string, 
  scratchDir: string, 
  basedir: string, 
  exitOnCompileError: boolean, 
  srcFiles: string[], 
  coverage: string[], 
  polyfills: string[]
): Promise<string> => {
  const startTime = Date.now();
  
  if (!isBunAvailable()) {
    throw new Error('Bun is required but not found. Please install Bun: https://bun.sh');
  }
  
  console.log(`Compiling ${srcFiles.length} tests with Bun...`);
  
  const scratchFile = path.join(scratchDir, 'compiled/tests-imports.ts');
  const dest = path.join(scratchDir, 'compiled/tests.js');
  const buildScriptPath = path.join(scratchDir, 'bun-build.js');
  
  try {
    mkdirp.sync(path.dirname(scratchFile));
    
    const imports = Imports.generateImports(true, scratchFile, srcFiles, polyfills);
    fs.writeFileSync(scratchFile, imports);
    
    const buildScript = generateBunBuildScript(scratchFile, dest);
    fs.writeFileSync(buildScriptPath, buildScript);
    const result = spawnSync('bun', [buildScriptPath], {
      cwd: basedir,
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    
    try {
      fs.unlinkSync(buildScriptPath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    if (result.status !== 0) {
      const errorMsg = `Bun compilation failed: ${result.stderr || result.stdout}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    const elapsedTime = Date.now() - startTime;
    console.log(`Compilation completed: ${dest} (${elapsedTime}ms)`);
    return dest;
    
  } catch (error) {
    try {
      fs.unlinkSync(buildScriptPath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    throw error;
  }
};