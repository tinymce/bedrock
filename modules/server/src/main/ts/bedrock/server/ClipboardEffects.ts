import * as childProcess from 'child_process';
import * as path from 'path';
import { ExitCodes } from '../util/ExitCodes';

/*
 JSON API for data: {
   import: "<file name>"
 }
 */
export interface ClipboardData {
  readonly import: string;
}

const importClipboard = (basedir: string, clipboarddir: string, data: ClipboardData): Promise<void> => {
  const fileName = data.import;
  const fullPath = path.join(clipboarddir, fileName);
  const args = [
    path.join(basedir, 'bin/wink.exe'),
    '-i ' + fullPath
  ];

  const result = childProcess.execSync(args.join(' '));
  if (result.length > 0) {
    console.error(result);
    process.exit(ExitCodes.failures.wink);
  }

  return Promise.resolve();
};

export const route = (basedir: string, clipboarddir: string) => {
  return (data: ClipboardData): Promise<void> => {
    return importClipboard(basedir, clipboarddir, data);
  };
};
