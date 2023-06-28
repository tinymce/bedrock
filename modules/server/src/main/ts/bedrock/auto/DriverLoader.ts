import { DriverSettings } from './Driver';
import * as ExecUtils from '../util/ExecUtils';

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

const loadPhantomJs = (settings: DriverSettings) => {
  const api = ExecUtils.execLoader('phantomjs', [ '--remote-debugger-port=' + settings.debuggingPort ]);

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

export const loadDriver = (browserName: string, settings: DriverSettings): ExecUtils.ChildAPI => {
  const driverDeps = browserModules[browserName] || [];
  if (driverDeps.length === 0) {
    console.log('Not loading a local driver for browser ' + browserName);
  } else {
    const driver = ExecUtils.findNpmPackage(driverDeps);
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
  const execPath = ExecUtils.findExecutable(execNames);
  if (execPath !== null) {
    return ExecUtils.execLoader(execPath);
  } else {
    throw new Error('Local1: Unable to find a suitable driver for ' + browserName);
  }
};

export const startAndWaitForAlive = (driverApi: ExecUtils.ChildAPI, port: number, timeout = 30000): Promise<void> => {
  // Start the driver
  const driverProc = driverApi.start(['--port=' + port]);
  // Wait for it to be alive
  return ExecUtils.waitForAlive(driverProc, port, timeout, 'http://127.0.0.1', '/status');
};

export type DriverAPI = ExecUtils.ChildAPI;