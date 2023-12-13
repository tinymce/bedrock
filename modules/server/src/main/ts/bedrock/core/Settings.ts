// Keep this file consistent with Clis.ts

export interface BedrockSettings {
  readonly basedir: string;
  readonly bundler: 'webpack' | 'rollup';
  readonly chunk: number;
  readonly loglevel: 'simple' | 'advanced';
  readonly overallTimeout: number;
  readonly projectdir: string;
  readonly singleTimeout: number;
  readonly stopOnFailure: boolean;
  readonly config: string;
  readonly coverage: string[];
  readonly customRoutes: string;
  readonly polyfills: string[];
  readonly bucket: number;
  readonly buckets: number;
  readonly testfiles: string[];
  readonly verbose: boolean;
  readonly webdriverPort: number;
  readonly useSelenium: boolean;
}

export type BedrockManualSettings = BedrockSettings;

export interface BedrockAutoSettings extends BedrockSettings {
  readonly gruntDone?: (success: boolean) => void;
  readonly browser: string;
  readonly debuggingPort?: number;
  readonly delayExit: boolean;
  readonly name: string;
  readonly output: string;
  readonly retries: number;
  readonly skipResetMousePosition: boolean;
  readonly useSandboxForHeadless: boolean;
  readonly extraBrowserCapabilities: string;
  readonly wipeBrowserCache: boolean;
  readonly remote: string;
  readonly sishDomain: string;
  readonly username: string;
  readonly accesskey: string;
  readonly devicefarmRegion: string;
  readonly devicefarmArn: string;
  readonly browserVersion: string;
  readonly platformName?: string;
}
