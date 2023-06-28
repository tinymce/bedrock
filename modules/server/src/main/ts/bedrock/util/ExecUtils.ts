import * as which from 'which';
import * as Arr from './Arr';
import * as crossSpawn from 'cross-spawn';
import { ChildProcess } from 'child_process';
import * as http from 'http';

export interface ChildAPI {
    start: (args?: string[]) => ChildProcess;
    stop: () => void;
    defaultInstance: ChildProcess | null;
}

export const execLoader = (exec: string, args: string[] = []): ChildAPI => {
    const api = {} as ChildAPI;
    api.start = (argsOverride = []) => {
      const finalArgs = args.concat(argsOverride);
      api.defaultInstance = crossSpawn(exec, finalArgs);
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
  
export const findNpmPackage = (driverDeps: string[]): ChildAPI => Arr.findMap(driverDeps, (driverDep) => {
    try {
      return require(driverDep);
    } catch (e) {
      return null;
    }
});
  
export const findExecutable = (execNames: string[]): string | null => Arr.findMap(execNames, (execName) => {
    return which.sync(execName, { nothrow: true });
});

export const waitForAlive = (proc: ChildProcess, port: number, timeout = 30000, baseUrl = 'http://127.0.0.1', path = ''): Promise<void> => {
    const url = baseUrl + ':' + port + path;
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
                  proc.removeListener('exit', onStartError);
                  proc.removeListener('error', onStartError);
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
      proc.on('exit', onStartError);
      proc.on('error', onStartError);
  
      // Start listening for the server to be ready
      checkServerStatus();
    });
  };
  