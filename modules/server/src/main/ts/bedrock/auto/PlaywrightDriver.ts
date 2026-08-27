import * as playwright from 'playwright';
import type { Browser as WdBrowser } from 'webdriverio';
import * as Shutdown from '../util/Shutdown';
import { Driver } from './Driver';

export interface PlaywrightDriverSettings {
  browser: string;
  headless: boolean;
  verbose: boolean;
  name?: string;
}

const PLAYWRIGHT_PREFIX = 'playwright-';
const HEADLESS_SUFFIX = '-headless';

export const isPlaywrightBrowser = (browser: string): boolean =>
  browser.startsWith(PLAYWRIGHT_PREFIX);

const getEngine = (browser: string): string => {
  const withoutPrefix = browser.substring(PLAYWRIGHT_PREFIX.length);
  return withoutPrefix.endsWith(HEADLESS_SUFFIX)
    ? withoutPrefix.substring(0, withoutPrefix.length - HEADLESS_SUFFIX.length)
    : withoutPrefix;
};

const resolveBrowserType = (engine: string): playwright.BrowserType => {
  switch (engine) {
    case 'chromium': return playwright.chromium;
    case 'firefox': return playwright.firefox;
    case 'webkit': return playwright.webkit;
    default: throw new Error(`Unknown playwright engine: ${engine}`);
  }
};

export const create = async (settings: PlaywrightDriverSettings): Promise<Driver> => {
  const engine = getEngine(settings.browser);
  const browserType = resolveBrowserType(engine);

  if (settings.verbose) {
    console.log(`Launching playwright ${engine}${settings.headless ? ' (headless)' : ''}...`);
  }

  const browser = await browserType.launch({ headless: settings.headless });
  const context = await browser.newContext({ viewport: settings.headless ? { width: 1280, height: 1024 } : null });
  const page = await context.newPage();

  console.log(`playwright ${engine} version:`, browser.version());

  const sessionId = `playwright-${engine}-${Date.now()}`;
  let closed = false;

  const close = async () => {
    if (closed) {
      return;
    }
    closed = true;
    try {
      await browser.close();
    } catch (e) {
      if (settings.verbose) {
        console.warn('Error closing playwright browser:', e);
      }
    }
  };

  // Minimal webdriver-compatible surface. Effects routes (/keys, /mouse, /clipboard)
  // are wired with Attempt.failed in BedrockAuto so they return "unsupported".
  const stub = {
    sessionId,
    capabilities: { browserName: engine },
    url: async (location: string) => {
      await page.goto(location);
    },
    pause: async (ms: number) => {
      await page.waitForTimeout(ms);
    },
    executeScript: async (_script: string, _args: unknown[]) => {
      // No-op: playwright is local, so things like LambdaTest status markers don't apply.
      return undefined;
    },
    execute: async (_fn: unknown, ..._args: unknown[]) => {
      return undefined;
    },
    deleteSession: close
  };

  const shutdown = async (_immediate?: boolean): Promise<void> => {
    await close();
  };

  Shutdown.registerShutdown((code, _immediate) => {
    close().finally(() => {
      process.exit(code);
    });
  });

  return {
    webdriver: stub as unknown as WdBrowser,
    shutdown
  };
};
