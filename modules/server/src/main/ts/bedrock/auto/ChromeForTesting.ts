import * as os from 'os';
import * as path from 'path';
import * as childProcess from 'child_process';
import {
  Browser,
  ChromeReleaseChannel,
  computeSystemExecutablePath,
  detectBrowserPlatform,
  getInstalledBrowsers,
  install,
  resolveBuildId
} from '@puppeteer/browsers';

/*
 * Chrome for Testing replaces the legacy `chromedriver` npm package. Google publishes a
 * matching chromedriver for every Chrome release, so rather than depending on a wrapper
 * package that lags behind the browser, we resolve the driver build that matches the
 * locally installed Chrome and cache it ourselves.
 *
 * chromedriver only has to match the *major* version of the browser it drives, so the
 * local Chrome's milestone is enough to pick a build.
 */

const getCacheDir = (): string =>
  process.env.BEDROCK_BROWSER_CACHE_DIR || path.join(os.homedir(), '.cache', 'bedrock', 'browsers');

// e.g. "Google Chrome 153.0.8010.53" -> "153"
const parseMilestone = (version: string): string | null => {
  const match = /(\d+)\.\d+\.\d+/.exec(version);
  return match === null ? null : match[1];
};

const getSystemChromeMilestone = (): string | null => {
  try {
    const executablePath = computeSystemExecutablePath({
      browser: Browser.CHROME,
      channel: ChromeReleaseChannel.STABLE
    });
    const output = childProcess.execFileSync(executablePath, [ '--version' ], {
      encoding: 'utf8',
      stdio: [ 'ignore', 'pipe', 'ignore' ]
    });
    return parseMilestone(output);
  } catch {
    // Chrome isn't installed in a standard location, so fall back to the stable channel
    return null;
  }
};

/**
 * Resolves the path to a Chrome for Testing chromedriver that matches the locally
 * installed Chrome, downloading it into the bedrock cache if it isn't there yet.
 * Returns `null` if a driver couldn't be resolved, so the caller can fall back to
 * whatever is on the system path.
 */
export const resolveChromedriver = async (): Promise<string | null> => {
  const platform = detectBrowserPlatform();
  if (platform === undefined) {
    console.log('Chrome for Testing does not publish a chromedriver for this platform.');
    return null;
  }

  const cacheDir = getCacheDir();
  const tag = getSystemChromeMilestone() || ChromeReleaseChannel.STABLE;

  try {
    const buildId = await resolveBuildId(Browser.CHROMEDRIVER, platform, tag);

    const installed = await getInstalledBrowsers({ cacheDir });
    const cached = installed.find((browser) =>
      browser.browser === Browser.CHROMEDRIVER && browser.buildId === buildId && browser.platform === platform);
    if (cached !== undefined) {
      return cached.executablePath;
    }

    console.log(`Downloading Chrome for Testing chromedriver ${buildId}...`);
    const downloaded = await install({ browser: Browser.CHROMEDRIVER, buildId, cacheDir, platform });
    return downloaded.executablePath;
  } catch (e: any) {
    console.log(`Unable to resolve a Chrome for Testing chromedriver for Chrome ${tag} (${e.message}).`);
    return null;
  }
};
