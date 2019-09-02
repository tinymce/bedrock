import * as childProcess from 'child_process';
import * as path from 'path';
import * as ExitCodes from '../util/ExitCodes';

const execSync = childProcess.execSync;

/*
 JSON API for data: {
   import: "<file name>"
 }
 */
const importClipboard = function (basedir, clipboarddir, data) {
  const fileName = data.import;
  const fullPath = path.join(clipboarddir, fileName);
  const args = [
    path.join(basedir, 'bin/wink.exe'),
    '-i ' + fullPath
  ];

  const result = execSync(args.join(' '));
  if (result.length > 0) {
    console.error(result);
    process.exit(ExitCodes.failures.wink);
  }

  return Promise.resolve({});
};

const route = function (basedir, clipboarddir) {
  return function (data) {
    return importClipboard(basedir, clipboarddir, data);
  };
};

module.exports = {
  route: route
};
