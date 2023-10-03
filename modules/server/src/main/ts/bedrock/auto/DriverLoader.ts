import { DriverSettings } from './Driver';
import * as ExecUtils from '../util/ExecUtils';

export interface DriverSpec {
  driverApi: DriverAPI;
  path: string;
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

const loadPhantomJs = (settings: DriverSettings) => {
  const api = ExecUtils.execLoader('phantomjs', [ '--remote-debugger-port=' + settings.debuggingPort ]);

  // Patch the start function to remap the arguments
  const origStart = api.start;
  api.start = (args = []) => {
    const patchedArgs = args.map((arg: any) => {
      return arg.indexOf('--port') !== -1 ? arg.replace('--port', '--webdriver') : arg;
    });
    return origStart(patchedArgs);
  };
  return api;
};

export const makeDriverStub = (): ExecUtils.ChildAPI => {
  return {
      start: () => null,
      stop: () => { console.log('Stop driver stub'); },
      defaultInstance: null
  };
};

export const loadDriver = (browserName: string, settings: DriverSettings): ExecUtils.ChildAPI => {
  const driverDeps = browserModules[browserName] || [];
  if (driverDeps.length === 0) {
    console.log('Not loading a local driver for browser ' + browserName);
  } else {
    const driver = ExecUtils.npmLoader(driverDeps);
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

export const startAndWaitForAlive = async (driverSpec: DriverSpec, port: number, timeout = 30000): Promise<void> => {
  const api = driverSpec.driverApi;
  
  // Start the driver
  let args;
  if (api.isNpm) {
    args = {port};
  } else {
    args = ['--port=' + port];
  }
  const driverProc = await driverSpec.driverApi.start(args);

  // Wait for it to be alive
  const status_url = 'http://127.0.0.1:' + port + driverSpec.path + '/status';
  return ExecUtils.waitForAlive(driverProc, status_url, timeout);
};

export type DriverAPI = ExecUtils.ChildAPI;