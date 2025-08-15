import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import { spawnSync } from 'child_process';
import * as crypto from 'crypto';
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
 * Generate a cache key based on source files and their modification times
 */
const generateCacheKey = (srcFiles: string[], polyfills: string[]): string => {
  const hash = crypto.createHash('sha256');
  
  // Include all source files and their modification times
  const sortedSrcFiles = [...srcFiles].sort();
  for (const file of sortedSrcFiles) {
    try {
      const stat = fs.statSync(file);
      hash.update(`${file}:${stat.mtime.getTime()}:${stat.size}`);
    } catch (error) {
      // If file doesn't exist, include it in hash anyway
      hash.update(`${file}:missing`);
    }
  }
  
  // Include polyfills in the cache key
  const sortedPolyfills = [...polyfills].sort();
  hash.update(sortedPolyfills.join(','));
  
  return hash.digest('hex').substring(0, 16);
};

/**
 * Extract plugin name from source files for cache directory isolation
 */
const extractPluginName = (srcFiles: string[]): string => {
  if (srcFiles.length === 0) return 'unknown';
  
  // Look for plugins/pluginname pattern in file paths
  for (const file of srcFiles) {
    const match = file.match(/plugins[/\\]([^/\\]+)/);
    if (match) {
      return match[1];
    }
  }
  
  // Fallback: use directory name from first file
  const firstFile = srcFiles[0];
  const dirname = path.dirname(firstFile);
  const parts = dirname.split(path.sep);
  return parts[parts.length - 1] || 'default';
};

/**
 * Check if cached compilation is still valid
 */
const isCacheValid = (dest: string, srcFiles: string[], polyfills: string[], expectedCacheKey: string): boolean => {
  if (!fs.existsSync(dest)) {
    return false;
  }
  
  const cacheInfoPath = dest.replace('.js', '.cache-info');
  if (!fs.existsSync(cacheInfoPath)) {
    return false;
  }
  
  try {
    const cacheInfo = JSON.parse(fs.readFileSync(cacheInfoPath, 'utf-8'));
    return cacheInfo.cacheKey === expectedCacheKey;
  } catch (error) {
    return false;
  }
};

/**
 * Save cache information for future validation
 */
const saveCacheInfo = (dest: string, cacheKey: string, srcFiles: string[], polyfills: string[]): void => {
  const cacheInfoPath = dest.replace('.js', '.cache-info');
  const cacheInfo = {
    cacheKey,
    timestamp: Date.now(),
    srcFiles: srcFiles.length,
    polyfills: polyfills.length
  };
  
  try {
    fs.writeFileSync(cacheInfoPath, JSON.stringify(cacheInfo, null, 2));
  } catch (error) {
    // Ignore cache info write errors
    console.warn('Failed to write cache info:', error.message);
  }
};

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
 * Clean up old cache files to prevent accumulation
 * Removes cache files older than the specified age
 */
export const cleanupOldCache = (scratchDir: string, maxAgeMs: number = 24 * 60 * 60 * 1000): void => {
  try {
    const compiledDir = path.join(scratchDir, 'compiled');
    if (!fs.existsSync(compiledDir)) {
      return;
    }

    const now = Date.now();
    const walk = (dir: string) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
          walk(fullPath);
          // Check if directory is empty after cleanup and remove it
          try {
            const remaining = fs.readdirSync(fullPath);
            if (remaining.length === 0) {
              fs.rmdirSync(fullPath);
            }
          } catch (error) {
            // Ignore errors when checking empty directories
          }
        } else if (item.isFile()) {
          try {
            const stat = fs.statSync(fullPath);
            if (now - stat.mtime.getTime() > maxAgeMs) {
              fs.unlinkSync(fullPath);
              console.log(`Cleaned up old cache file: ${fullPath}`);
            }
          } catch (error) {
            // Ignore errors for individual files
          }
        }
      }
    };
    
    walk(compiledDir);
  } catch (error) {
    console.warn('Cache cleanup failed:', error.message);
  }
};

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
  
  // Generate cache key and plugin-specific paths
  const cacheKey = generateCacheKey(srcFiles, polyfills);
  const pluginName = extractPluginName(srcFiles);
  
  // Use plugin-specific cache directory to prevent cross-contamination
  const pluginCacheDir = path.join(scratchDir, 'compiled', pluginName);
  const scratchFile = path.join(pluginCacheDir, `tests-imports-${cacheKey}.ts`);
  const dest = path.join(pluginCacheDir, `tests-${cacheKey}.js`);
  const buildScriptPath = path.join(pluginCacheDir, `bun-build-${cacheKey}.js`);
  
  // Check if we can use cached compilation
  if (isCacheValid(dest, srcFiles, polyfills, cacheKey)) {
    const elapsedTime = Date.now() - startTime;
    console.log(`Using cached compilation: ${dest} (${elapsedTime}ms)`);
    return dest;
  }
  
  console.log(`Compiling ${srcFiles.length} tests for plugin '${pluginName}' with Bun...`);
  
  // Clean up old cache files periodically (files older than 1 hour)
  cleanupOldCache(scratchDir, 60 * 60 * 1000);
  
  try {
    mkdirp.sync(path.dirname(scratchFile));
    
    // Clean up any old cache files for this plugin to prevent accumulation
    try {
      const cacheDir = path.dirname(scratchFile);
      if (fs.existsSync(cacheDir)) {
        const files = fs.readdirSync(cacheDir);
        for (const file of files) {
          if (file.startsWith('tests-') && !file.includes(cacheKey)) {
            const oldFile = path.join(cacheDir, file);
            fs.unlinkSync(oldFile);
          }
        }
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
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
    
    // Save cache information for future validation
    saveCacheInfo(dest, cacheKey, srcFiles, polyfills);
    
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