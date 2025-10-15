import * as fs from 'fs';
import glob = require('glob');
import readdirSyncRec = require('recursive-readdir-sync');
import { Attempt } from '../core/Attempt';
import * as Qstring from '../util/Qstring';

/**
 * Constants for file deduplication
 */
const SOURCE_DIR_INDICATOR = '/src/';
const COMPILED_DIR_INDICATOR = '/lib/';

/**
 * Removes duplicate test files, preferring compiled JavaScript over TypeScript sources
 */
const deduplicateTestFiles = (files: string[]): string[] => {
  // Create a map of base names to their file paths for quick lookups
  const filesByBaseName = new Map<string, string[]>();
  
  files.forEach(file => {
    const baseName = file.split('/').pop()?.replace(/\.(ts|js)$/, '') || '';
    if (!filesByBaseName.has(baseName)) {
      filesByBaseName.set(baseName, []);
    }
    filesByBaseName.get(baseName)!.push(file);
  });
  
  const result: string[] = [];
  
  filesByBaseName.forEach((filePaths) => {
    if (filePaths.length === 1) {
      // No duplicates, include the single file
      result.push(filePaths[0]);
    } else {
      // Multiple files with same base name - prefer compiled JS over TS source
      const compiledJs = filePaths.find(f => f.includes(COMPILED_DIR_INDICATOR) && f.endsWith('.js'));
      if (compiledJs) {
        result.push(compiledJs);
      } else {
        // No compiled version found, use the first TypeScript source
        const tsSource = filePaths.find(f => f.includes(SOURCE_DIR_INDICATOR) && f.endsWith('.ts'));
        result.push(tsSource || filePaths[0]);
      }
    }
  });
  
  return result;
};

export const file = (name: string, rawValue: string): Attempt<string[], string> => {
  // Ignore any query strings when checking if a file exists
  const parsed = Qstring.parse(rawValue);
  const value = parsed.base;
  try {
    fs.accessSync(value);
    if (!fs.statSync(value).isFile()) {
      return Attempt.failed([`Property: ${name} => Value: ${value} was not a file`]);
    }
    return Attempt.passed(parsed.original);
  } catch (err) {
    return Attempt.failed([`Property [${name}] has value: [${value}]. This file does not exist`]);
  }
};

export const inSet = (candidates: string[]) => {
  return (name: string, value: string): Attempt<string[], string> => {
    if (candidates.indexOf(value) === -1) {
      return Attempt.failed([
        `Invalid value for property: ${name}. Actual value: ${value}. Required value: one of ${JSON.stringify(candidates)}`
      ]);
    } else {
      return Attempt.passed(value);
    }
  };
};

export const any = <E, A> (name: string, value: A): Attempt<E, A> => {
  return Attempt.passed(value);
};

export const positiveInteger = (name: string, value: string): Attempt<string[], number> => {
  const failed = Attempt.failed<string[], number>([`Invalid value for property: ${name}: [${value}] is not a positive integer`]);
  if (!Number.isInteger(value)) {
    return failed;
  }
  const n = Number(value);
  if (n <= 0) {
    return failed;
  } else {
    return Attempt.passed(n);
  }
};

export const directory = (name: string, value: string): Attempt<string[], string> => {
  try {
    if (!fs.lstatSync(value).isDirectory()) {
      return Attempt.failed([`[${value}] is not a directory`]);
    } else {
      return Attempt.passed(value);
    }
  } catch (err) {
    return Attempt.failed([`[${value}] is not a directory`]);
  }
};

export const files = (patterns: string[]) => {
  return (name: string, value: string): Attempt<string[], string[]> => {
    const dirs = glob.sync(value);

    if (dirs.length === 0) {
      return Attempt.failed([`[${value}] does not match any directories`]);
    } else {
      try {
        const scanned = dirs.reduce((result, d) => result.concat(readdirSyncRec(d)), [] as string[]);

        const filtered = scanned.filter((f) => {
          // Skip source map files
          if (f.endsWith('.js.map')) {
            return false;
          }
          
          const matches = patterns.filter((p) => {
            return f.indexOf(p) > -1;
          });

          return matches.length > 0 && fs.lstatSync(f).isFile();
        });
        
        // Remove duplicates: prefer compiled JavaScript files over TypeScript source files for performance
        const deduped = deduplicateTestFiles(filtered);
        return Attempt.passed(deduped);
      } catch (err) {
        return Attempt.failed([
          `Error scanning [${value}] for files matching pattern: [${patterns.join(', ')}]`
        ]);
      }
    }
  };
};
