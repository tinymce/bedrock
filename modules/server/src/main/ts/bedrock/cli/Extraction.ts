import * as fs from 'fs';
import glob = require('glob');
import readdirSyncRec = require('recursive-readdir-sync');
import { Attempt } from '../core/Attempt';
import * as Qstring from '../util/Qstring';

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
          const matches = patterns.filter((p) => {
            return f.indexOf(p) > -1;
          });

          return matches.length > 0 && fs.lstatSync(f).isFile();
        });
        return Attempt.passed(filtered);
      } catch (err) {
        return Attempt.failed([
          `Error scanning [${value}] for files matching pattern: [${patterns.join(', ')}]`
        ]);
      }
    }
  };
};
