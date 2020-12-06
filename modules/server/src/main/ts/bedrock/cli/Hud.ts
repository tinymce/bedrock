import * as readline from 'readline';

interface ResultData {
  readonly done: boolean;
  readonly id: string;
  readonly numFailed: number;
  readonly numSkipped: number;
  readonly numPassed: number;
  readonly test?: string;
  readonly totalFiles?: number;
  readonly totalTests?: number;
}

export interface Hud {
  readonly update: (data: ResultData) => Promise<void>;
  readonly complete: () => Promise<void>;
}

export const create = (testfiles: string[], loglevel: 'simple' | 'advanced'): Hud => {
  let started = false;

  const stream = process.stdout;

  const numFiles = testfiles.length > 0 ? testfiles.length : '?';

  const writeProgress = (id: string, stopped: boolean, numPassed: number, numSkipped: number, numFailed: number, total: number | '?') => {
    const numRun = numPassed + numFailed + numSkipped;
    const status = stopped ? (numRun < total ? 'STOPPED' : 'COMPLETE') : 'RUNNING';
    stream.write(
      'Session: ' + id + ', Status: ' + status + ', Progress: ' + numRun + '/' + total +
      ', Failed: ' + numFailed + ', Skipped: ' + numSkipped + ' ... ' + '\n'
    );
    readline.clearLine(stream, 1);
    return Promise.resolve();
  };

  const advUpdate = (data: ResultData) => {
    if (started) {
      // Note, this writes over the above line, which is why we only do this after the first update.
      readline.moveCursor(stream, 0, -2);
    } else {
      started = true;
    }
    readline.clearLine(stream, 0);
    readline.cursorTo(stream, 0);
    stream.write('Current test: ' + (data.test !== undefined ? data.test.substring(0, 60) : 'Unknown') + '\n');
    const totalFiles = data.totalFiles !== undefined ? data.totalFiles : numFiles;
    const totalTests = data.totalTests !== undefined ? data.totalTests : totalFiles;
    return writeProgress(data.id, data.done, data.numPassed, data.numSkipped, data.numFailed, totalTests);
  };

  const complete = () => {
    return Promise.resolve();
  };

  const basicUpdate = (_data: ResultData) => {
    stream.write('.');
    return Promise.resolve();
  };

  const supportsAdvanced = (() => {
    return readline.clearLine !== undefined &&
      readline.moveCursor !== undefined &&
      readline.cursorTo !== undefined;
  })();

  return {
    update: loglevel === 'advanced' && supportsAdvanced ? advUpdate : basicUpdate,
    complete
  };
};
