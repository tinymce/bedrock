export interface BedrockSettings {
  readonly basedir: string;
  readonly bundler: 'webpack' | 'rollup';
  readonly chunk: number;
  readonly gruntDone?: (success: boolean) => void;
  readonly loglevel: 'simple' | 'advanced';
  readonly overallTimeout: number;
  readonly projectdir: string;
  readonly singleTimeout: number;
  readonly stopOnFailure: boolean;
}

export interface BedrockManualSettings extends BedrockSettings {
  readonly config: string;
  readonly coverage: string[];
  readonly customRoutes: string;
  readonly polyfills: string[];
  readonly testfiles: string[];
}

export interface BedrockAutoSettings extends BedrockSettings {
  readonly browser: string;
  readonly config: string;
  readonly coverage: string[];
  readonly customRoutes: string;
  readonly debuggingPort: number;
  readonly delayExit: boolean;
  readonly name: string;
  readonly output: string;
  readonly polyfills: string[];
  readonly retries: number;
  readonly skipResetMousePosition: boolean;
  readonly testfiles: string[];
  readonly useSandboxForHeadless: boolean;
  readonly wipeBrowserCache: boolean;
}

export interface BedrockFrameworkSettings extends BedrockSettings {
  readonly browser: string;
  readonly debuggingPort: number;
  readonly framework: string;
  readonly name: string;
  readonly output: string;
  readonly page: string;
}