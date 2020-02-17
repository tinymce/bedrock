export interface BedrockSettings {
  basedir: string;
  bundler: 'webpack' | 'rollup';
  chunk: number;
  config: string;
  coverage: string[];
  customRoutes: string;
  gruntDone?: (success: boolean) => void;
  loglevel: 'simple' | 'advanced';
  name: string;
  output: string;
  overallTimeout: number;
  projectdir: string;
  singleTimeout: number;
  testfiles: string[];
}

export interface BedrockAutoSettings extends BedrockSettings {
  browser: string;
  debuggingPort: number;
  delayExit: boolean;
  retries: number;
  skipResetMousePosition: boolean;
  stopOnFailure: boolean;
  useSandboxForHeadless: boolean;
  wipeBrowserCache: boolean;
}

export interface BedrockFrameworkSettings extends BedrockSettings {
  browser: string;
  debuggingPort: number;
  framework: string;
  page: string;
  stopOnFailure: boolean;
}