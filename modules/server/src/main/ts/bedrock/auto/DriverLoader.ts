import { ChildProcess } from 'child_process';
import * as crossSpawn from 'cross-spawn';
import * as http from 'http';
import * as which from 'which';
import * as Arr from '../util/Arr';
import { DriverSettings } from './Driver';

export interface DriverAPI {
  start: (args?: string[]) => ChildProcess;
  stop: () => void;
  defaultInstance: ChildProcess | null;
}

const browserModules: Record<string, string[]> = {
  'chrome': [ 'chromedriver' ],
  'firefox': [ 'geckodriver' ],
  'internet explorer': [ 'iedriver' ],
  'MicrosoftEdge': [ 'msedgedriver', 'edgedriver' ]
};

const browserExecutables: Record<string, string[]> = {
  'safari': [ 'safaridriver' ],
  'chrome': [ 'chromedriver' ],
  'firefox': [ 'geckodriver' ],
  'internet explorer': [ 'IEDriverServer' ],
  'MicrosoftEdge': [ 'msedgedriver', 'MicrosoftWebDriver' ]
};

const execLoader = (exec: string, driverArgs: string[] = []) => {
  const api = {} as DriverAPI;
  api.start = (args = []) => {
    const finalArgs = driverArgs.concat(args);
    api.defaultInstance = crossSpawn(exec, finalArgs);
    return api.defaultInstance;
  };

  api.stop = () => {
    if (api.defaultInstance) {
      api.defaultInstance.kill();
      api.defaultInstance = null;
    }
  };

  return api;
};

const findNpmPackage = (driverDeps: string[]) => Arr.findMap(driverDeps, (driverDep) => {
  try {
    return require(driverDep);
  } catch (e) {
    return null;
  }
});

const findExecutable = (execNames: string[]) => Arr.findMap(execNames, (execName) => {
  return which.sync(execName, { nothrow: true });
});

const loadPhantomJs = (settings: DriverSettings) => {
  const api = execLoader('phantomjs', [ '--remote-debugger-port=' + settings.debuggingPort ]);

  // Patch the start function to remap the arguments
  const origStart = api.start;
  api.start = (args = []) => {
    const patchedArgs = args.map((arg) => {
      return arg.indexOf('--port') !== -1 ? arg.replace('--port', '--webdriver') : arg;
    });
    return origStart(patchedArgs);
  };
  return api;
};

export const loadDriver = (browserName: string, settings: DriverSettings): DriverAPI => {
  const driverDeps = browserModules[browserName] || [];
  if (driverDeps.length === 0) {
    console.log('Not loading a local driver for browser ' + browserName);
  } else {
    const driver = findNpmPackage(driverDeps);
    if (driver !== null) {
      return driver;
    } else {
      console.log(`No local ${driverDeps[0]} for ${browserName}. Searching system path...`);
    }
  }

  // Handle phantomjs a little differently
  if (browserName === 'phantomjs') {
    return loadPhantomJs(settings);
  }

  const execNames = browserExecutables[browserName] || [];
  const execPath = findExecutable(execNames);
  if (execPath !== null) {
    return execLoader(execPath);
  } else {
    throw new Error('Unable to find a suitable driver for ' + browserName);
  }
};

export const waitForAlive = (proc: ChildProcess, port: number, timeout = 30000): Promise<void> => {
  const url = 'http://127.0.0.1:' + port + '/status';
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

export const startAndWaitForAlive = (driverApi: DriverAPI, port: number, timeout = 30000): Promise<void> => {
  // Start the driver
  const driverProc = driverApi.start(['--port=' + port]);
  // Wait for it to be alive
  return waitForAlive(driverProc, port, timeout);
};