import * as which from 'which';
import * as Arr from './Arr';
import * as crossSpawn from 'cross-spawn';
import { ChildProcess } from 'child_process';
import * as http from 'http';
import * as deepmerge from 'deepmerge';

export interface ChildAPI {
  start: (...args: any[]) => Promise<ChildProcess | null> | ChildProcess | null;
  stop: () => void;
  defaultInstance: ChildProcess | null;
  readonly isNpm?: boolean;
}

export const execLoader = (exec: string, args: string[] = []): ChildAPI => {
  const api = childAPIWrapper(crossSpawn, false, exec, args);
  return api;
};

// Npm drivers (e.g. geckodriver) are called differently to binaries. This is to conform them
// into a single compatible type. I don't think npm drivers were used until WDIOv8, which has them
// installed by default as dependencies.
// Exec example:
// const api = ChildAPIWrapper(crossSpawn, 'geckodriver', ['port=4444']);
// Npm example:
// const api = ChildAPIWrapper(require('geckodriver'), {port: 4444})
const childAPIWrapper = (startFunc: ChildAPI['start'], isNpm: boolean, ...defaultArgs: (string|string[]|Record<string,unknown>)[]): ChildAPI => {
  const api = {
    isNpm,
    defaultInstance: null
  } as ChildAPI;

  // This could definitely be nicer. Types need a deeper review
  const coalesceArgs = (baseArgs: unknown[], override: unknown[]): unknown[] => {
    const args = [baseArgs[0]]; // exec path
    const defaultOptions = baseArgs[1];
    const overrideOptions = override[0];
    if (defaultOptions && overrideOptions) {
      args.push(deepmerge(defaultOptions, overrideOptions));
    }
    if (defaultOptions || overrideOptions) {
      args.push(defaultOptions || overrideOptions);
    }
    return args;
  };

  api.start = async (...argsOverride) => {
    const args = isNpm ? deepmerge(defaultArgs, argsOverride) : coalesceArgs(defaultArgs, argsOverride);
    api.defaultInstance = await startFunc(...args);
    return api.defaultInstance;
  };

  api.stop = (signal: number | NodeJS.Signals | undefined = undefined) => {
    if (api.defaultInstance) {
      api.defaultInstance.kill(signal);
      api.defaultInstance = null;
    }
  };

  return api;
};

const findNpmPackage = (driverDeps: string[]): any => Arr.findMap(driverDeps, (driverDep) => {
    try {
      return require(driverDep);
    } catch (e) {
      return null;
    }
});

export const npmLoader = (driverDeps: string[]): ChildAPI | null => {
  const npmDriver = findNpmPackage(driverDeps);
  if (npmDriver === null) {
    return null;
  }
  return childAPIWrapper(npmDriver.start, true);
};

export const findExecutable = (execNames: string[]): string | null => Arr.findMap(execNames, (execName) => {
    return which.sync(execName, { nothrow: true });
});

export const waitForAlive = (proc: ChildProcess | null, url: string, timeout: number): Promise<void> => {
  const start = Date.now();
  return new Promise<void>((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const onStartError = (error: string) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      reject('Driver failed to start (' + error + ')');
    };

    const onServerError = (err: string) => {
      if (Date.now() - start > timeout) {
        reject('Timed out waiting for the webdriver server. Error: ' + err);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        timeoutId = setTimeout(checkServerStatus, 50);
      }
    };

    const checkServerStatus = () => {
      http.get(url, (res) => {
        if (res.statusCode === 200) {
          let rawData = '';
          res.on('data', (chunk) => rawData += chunk);
          res.on('end', () => {
            try {
              const data = JSON.parse(rawData);
              if (data.value.ready || data.status === 0) {
                if (proc) {
                  proc.removeListener?.('exit', onStartError);
                  proc.removeListener?.('error', onStartError);
                }
                resolve();
              } else {
                onServerError('Not ready to accept connections');
              }
            } catch (e) {
              onServerError(e.message);
            } 
          });
        } else {
          onServerError('Received non 200 status (' + res.statusCode + ')');
        }
      }).on('error', onServerError);
    };

    // Bind process listeners
    if (proc) {
      proc.on?.('exit', onStartError);
      proc.on?.('error', onStartError);
    }
    // Start listening for the server to be ready
    checkServerStatus();
  });
};
  