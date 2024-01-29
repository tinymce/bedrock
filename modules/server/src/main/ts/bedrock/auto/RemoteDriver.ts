
import * as WebdriverIO from 'webdriverio';
import * as deepmerge from 'deepmerge';
import { DeviceFarmClient, CreateTestGridUrlCommand } from '@aws-sdk/client-device-farm';
import { Driver, DriverSettings } from './Driver';

const getFarmUrl = async (awsRegion: string, projectArn: string, expires = 5000): Promise<URL> => {
  console.log('Creating DeviceFarmClient...');
  const client = new DeviceFarmClient({region: awsRegion});
  const input = {
    projectArn,
    expiresInSeconds: expires
  };
  console.log('Sending command to create DF Test Grid URL...');
  const command = new CreateTestGridUrlCommand(input);
  const response = await client.send(command);
  console.log('DF URL expires at:', response.expires);
  return new URL(response.url as string);
};

const createFarm = async (browserName: string, remoteOpts: WebdriverIO.RemoteOptions, settings: DriverSettings): Promise<Driver> => {
  try {
    const validBrowsers = ['firefox', 'chrome', 'MicrosoftEdge'];
    if (!validBrowsers.includes(browserName)) {
      return Promise.reject('Browser [' + browserName + '] is not a valid Device Farm browser');
    }
    const region = settings.devicefarmRegion ?? process.env.AWS_REGION ?? 'us-west-2';
    const projectArn = settings.deviceFarmArn ?? process.env.AWS_ARN;

    if (!projectArn) {
      return Promise.reject('No AWS Resource Name (ARN)');
    }

    const url = await getFarmUrl(region, projectArn);

    // aws:maxDurationSecs is the maximum duration of the session before it is forcibly closed. (180 - 2400)
    const options = deepmerge(remoteOpts, {
      hostname: url.host,
      path: url.pathname,
      protocol: 'https',
      port: 443,
      capabilities: {
        'aws:maxDurationSecs': 2400,
      },
    });

    console.log('Starting Device Farm session with options:', JSON.stringify(options, null, 2));
    const driver = await WebdriverIO.remote(options);
    console.log('Webdriver started.');

    return {
      webdriver: driver,
      shutdown: (_: boolean | undefined) => {
        console.log('Shutting down Device Farm. This currently does nothing.');
        return driver.deleteSession();
      }
    };
  } catch (e) {
    return Promise.reject(e);
  }
};

export const getApi = async (settings: DriverSettings, browser: string, opts: WebdriverIO.RemoteOptions): Promise<Driver> => {
  const remoteWebdriver = settings.remoteWebdriver;
  if (remoteWebdriver === 'aws') {
    const farmApi = await createFarm(browser, opts, settings);
    return farmApi;
  }
  if (remoteWebdriver == 'lambdatest') {
    const driver = await WebdriverIO.remote(opts);
    return {
      webdriver: driver,
      shutdown: () => driver.deleteSession()
    };
  }
  return Promise.reject('Unrecognized remote provider: [' + remoteWebdriver + ']');
};

const addDriverSpecificOpts = (opts: WebdriverIO.RemoteOptions, settings: DriverSettings): WebdriverIO.RemoteOptions => {
  if (settings.remoteWebdriver === 'lambdatest') {
    // For naming in LT we use PROJECT_BUILD[_NAME] or BUILD
    const getProjectNaming = (name: string) => {
      const names = name.split('_');
      if (names.length > 1) {
        return {
          project: names[0],
          build: names[1],
          ...(names.length > 2 ? { name: names[2] } : {})
        };
      } else {
        return { build: names[0] };
      }
    };
    const names = settings.name ? getProjectNaming(settings.name) : {};
    const tunnelName = settings.tunnel?.name ? { tunnelName: settings.tunnel.name } : {};
    const platformName = settings.platformName ? { platformName: settings.platformName } : {};
    return deepmerge(opts, {
      user: settings.username,
      key: settings.accesskey,
      capabilities: {
        'LT:Options': {
          username: settings.username,
          accesskey: settings.accesskey,
          tunnel: true,
          console: true,
          w3c: true,
          plugin: 'node_js-webdriverio',
          ...platformName,
          ...tunnelName,
          ...names
        }
      }
    });
  }
  return opts;
};

const addBrowserSpecificOpts = (opts: WebdriverIO.RemoteOptions, browser: string): WebdriverIO.RemoteOptions => {
  if (browser === 'firefox') {
    // Change firefox log level for readability
    return deepmerge(opts, {
      capabilities: {
        'moz:firefoxOptions': {
          log: { level: 'warn' }
        }
      }
    });
  }
  return opts;
};

export const getOpts = (browserName: string, settings: DriverSettings): WebdriverIO.RemoteOptions => {
  const driverOpts: WebdriverIO.RemoteOptions = {
    capabilities: {
      browserVersion: settings.browserVersion
    }
  };
  const withBrowserOpts = addDriverSpecificOpts(driverOpts, settings);
  const withDriverOpts = addBrowserSpecificOpts(withBrowserOpts, browserName);

  return withDriverOpts;
};