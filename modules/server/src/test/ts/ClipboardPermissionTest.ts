import { assert } from 'chai';
import * as Driver from '../../main/ts/bedrock/auto/Driver';
import * as webdriverio from 'webdriverio';

describe('ClipboardPermission', function () {
  this.timeout(10000); // Increase timeout to 10 seconds

  it('should add clipboard permission for Chrome when enabled', async () => {
    const settings: Driver.DriverSettings = {
      basedir: '',
      browser: 'chrome',
      headless: false,
      useSandboxForHeadless: false,
      extraBrowserCapabilities: '',
      verbose: false,
      browserVersion: 'latest',
      clipboardPermission: true
    };

    let capturedOptions: any;
    const originalRemote = (webdriverio as any).remote;
    (webdriverio as any).remote = (opts: any) => {
      capturedOptions = opts;
      return Promise.resolve({ capabilities: { browserName: 'chrome', version: '1.0' } });
    };

    try {
      await Driver.create(settings);

      const chromeOptions = capturedOptions.capabilities['goog:chromeOptions'];
      assert.isTrue(chromeOptions.args.includes('--enable-clipboard'),
        'Chrome options should include --enable-clipboard when clipboardPermission is true');
    } finally {
      (webdriverio as any).remote = originalRemote;
    }
  });

  it('should not add clipboard permission for Chrome when disabled', async () => {
    const settings: Driver.DriverSettings = {
      basedir: '',
      browser: 'chrome',
      headless: false,
      useSandboxForHeadless: false,
      extraBrowserCapabilities: '',
      verbose: false,
      browserVersion: 'latest',
      clipboardPermission: false
    };

    let capturedOptions: any;
    const originalRemote = (webdriverio as any).remote;
    (webdriverio as any).remote = (opts: any) => {
      capturedOptions = opts;
      return Promise.resolve({ capabilities: { browserName: 'chrome', version: '1.0' } });
    };

    try {
      await Driver.create(settings);

      const chromeOptions = capturedOptions.capabilities['goog:chromeOptions'];
      assert.isFalse(chromeOptions.args.includes('--enable-clipboard'),
        'Chrome options should not include --enable-clipboard when clipboardPermission is false');
    } finally {
      (webdriverio as any).remote = originalRemote;
    }
  });
});
