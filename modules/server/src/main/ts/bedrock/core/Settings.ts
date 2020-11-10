export interface BedrockSettings {
  readonly basedir: string;
  readonly bundler: 'webpack' | 'rollup';
  readonly chunk: number;
  readonly config: string;
  readonly coverage: string[];
  readonly customRoutes: string;
  readonly gruntDone?: (success: boolean) => void;
  readonly loglevel: 'simple' | 'advanced';
  readonly name: string;
  readonly output: string;
  readonly overallTimeout: number;
  readonly projectdir: string;
  readonly singleTimeout: number;
  readonly testfiles: string[];
}

export interface BedrockAutoSettings extends BedrockSettings {
  readonly browser: string;
  readonly debuggingPort: number;
  readonly delayExit: boolean;
  readonly retries: number;
  readonly skipResetMousePosition: boolean;
  readonly stopOnFailure: boolean;
  readonly useSandboxForHeadless: boolean;
  readonly wipeBrowserCache: boolean;
}

export interface BedrockFrameworkSettings extends BedrockSettings {
  readonly browser: string;
  readonly debuggingPort: number;
  readonly framework: string;
  readonly page: string;
  readonly stopOnFailure: boolean;
}