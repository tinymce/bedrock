import { ChildProcess } from 'child_process';
import * as crossSpawn from 'cross-spawn';
import * as http from 'http';

export interface DriverAPI {
  start: (args?: string[]) => ChildProcess;
  stop: () => void;
  defaultInstance: ChildProcess | null;
}

const browserModules: Record<string, string> = {
  'chrome': 'chromedriver',
  'firefox': 'geckodriver',
  'internet explorer': 'iedriver',
  'MicrosoftEdge': 'edgedriver'
};

const browserExecutables: Record<string, string> = {
  'safari': 'safaridriver',
  'chrome': 'chromedriver',
  'firefox': 'geckodriver',
  'internet explorer': 'IEDriverServer',
  'MicrosoftEdge': 'MicrosoftWebDriver'
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

const loadPhantomJs = () => {
  const api = execLoader('phantomjs');

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

export const loadDriver = (browserName: string): DriverAPI => {
  const driverDep = browserModules[browserName];
  if (driverDep === undefined) {
    console.log('Not loading a local driver for browser ' + browserName);
  } else {
    try {
      return require(driverDep);
    } catch (e) {
      console.log(`No local ${driverDep} for ${browserName}. Searching system path...`);
    }
  }

  const execName = browserExecutables[browserName] || driverDep;
  if (browserName === 'phantomjs') {
    return loadPhantomJs();
  } else if (execName !== undefined) {
    return execLoader(execName);
  } else {
    throw new Error('Unable to find a suitable driver for ' + browserName)
  }
};

export const waitForAlive = (proc: ChildProcess, port: number, timeout = 30000) => {
  const url = 'http://localhost:' + port + '/status';
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
  })
};

export const startAndWaitForAlive = (driverApi: DriverAPI, port: number, timeout = 30000) => {
  // Start the driver
  const driverProc = driverApi.start(['--port=' + port]);
  // Wait for it to be alive
  return waitForAlive(driverProc, port, timeout);
};