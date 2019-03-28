import { ChildProcess } from 'child_process';
import * as crossSpawn from 'cross-spawn';
import * as http from 'http';

export interface DriverAPI {
  start: (args: any[]) => ChildProcess;
  stop: () => void;
  defaultInstance: ChildProcess;
}

const browserModules = {
  'chrome': 'chromedriver',
  'firefox': 'geckodriver',
  'internet explorer': 'iedriver',
  'MicrosoftEdge': 'edgedriver'
};

const browserExecutables = {
  'safari': 'safaridriver',
  'chrome': 'chromedriver',
  'firefox': 'geckodriver',
  'internet explorer': 'IEDriverServer',
  'MicrosoftEdge': 'MicrosoftWebDriver'
};

const execLoader = function (exec, driverArgs = []) {
  const api = {} as DriverAPI;
  api.start = function (args) {
    const finalArgs = driverArgs.concat(args || []);
    api.defaultInstance = crossSpawn(exec, finalArgs);
    return api.defaultInstance;
  };

  api.stop = function () {
    if (api.defaultInstance) {
      api.defaultInstance.kill();
      api.defaultInstance = null;
    }
  };

  return api;
};

const loadPhantomJs = function () {
  const api = execLoader('phantomjs');

  // Patch the start function to remap the arguments
  const origStart = api.start;
  api.start = function (args) {
    const patchedArgs = args.map(function (arg) {
      return arg.indexOf('--port') !== -1 ? arg.replace('--port', '--webdriver') : arg;
    });
    return origStart(patchedArgs);
  };
  return api;
};

export const loadDriver = function (browserName: string) {
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

export const waitForAlive = function (proc: ChildProcess, port: number, timeout = 30000) {
  const url = 'http://localhost:' + port + '/status';
  const start = Date.now();
  return new Promise(function (resolve, reject) {
    let timeoutId = null;

    function onStartError (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      reject('Driver failed to start (' + error + ')');
    }

    function onServerError () {
      if (Date.now() - start > timeout) {
        reject('Timed out waiting for the webdriver server');
      } else {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        timeoutId = setTimeout(checkServerStatus, 50);
      }
    }

    function checkServerStatus () {
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
                onServerError();
              }
            } catch (e) {
              onServerError();
            }
          });
        } else {
          onServerError();
        }
      }).on('error', onServerError);
    }

    // Bind process listeners
    proc.on('exit', onStartError);
    proc.on('error', onStartError);

    // Start listening for the server to be ready
    checkServerStatus();
  })
};

export const startAndWaitForAlive = function (driverApi: DriverAPI, port: number, timeout = 30000) {
  // Start the driver
  const driverProc = driverApi.start(['--port=' + port]);
  // Wait for it to be alive
  return waitForAlive(driverProc, port, timeout);
};