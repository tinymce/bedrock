
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
        return Promise.resolve();
      }
    };
  } catch (e) {
    return Promise.reject(e);
  }
};

export const getApi = async (settings: DriverSettings, browser: string, opts: WebdriverIO.RemoteOptions, tunnel: any): Promise<Driver> => {
  const remoteWebdriver = settings.remoteWebdriver;
  if (remoteWebdriver === 'aws') {
    const farmApi = await createFarm(browser, opts, settings);
    return farmApi;
  }
  if (remoteWebdriver == 'lambdatest') {
    console.log('getting lt webdriver');
    if (tunnel.tunnel.isRunning()) {
      console.log('tunnel is running');
    }
    let driver: WebdriverIO.Browser;
    try {
      driver = await WebdriverIO.remote(opts);
    } catch(e) {
      console.log('Failed to create webdriver');
      await tunnel.tunnel.stop();
      console.log('stopped tunnel');
      console.log(e);
      throw new Error(e)
    }
    console.log('driver: ', driver);
    return {
      webdriver: driver,
      shutdown: async () => {
        await driver?.deleteSession();
      }
    };
  }
  return Promise.reject('Unrecognized remote provider: [' + remoteWebdriver + ']');
};

const addDriverSpecificOpts = (opts: WebdriverIO.RemoteOptions, settings: DriverSettings): WebdriverIO.RemoteOptions => {
  if (settings.remoteWebdriver === 'lambdatest') {
    const tunnelName = settings.tunnelName ? { tunnelname: settings.tunnelName } : {};
    const platformName = settings.platformName ? { platformName: settings.platformName } : {};
    return deepmerge(opts, {
      user: settings.username,
      key: settings.accesskey,
      capabilities: {
        'LT:Options': {
          username: settings.username,
          accesskey: settings.accesskey,
          tunnel: true,
          // loadbalanced: true,
          // tunnelname: 'testing-tunnel-static',
          console: true,
          w3c: true,
          plugin: 'node_js-webdriverio',
          ...platformName,
          ...tunnelName
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
  const withDriverOpts = addDriverSpecificOpts(driverOpts, settings);
  const withBrowserOpts = addBrowserSpecificOpts(withDriverOpts, browserName);

  return withBrowserOpts;
};