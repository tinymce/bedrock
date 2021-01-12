// Keep this file consistent with Clis.ts

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
  readonly config: string;
  readonly coverage: string[];
  readonly customRoutes: string;
  readonly polyfills: string[];
  readonly testfiles: string[];
}

export type BedrockManualSettings = BedrockSettings;

export interface BedrockAutoSettings extends BedrockSettings {
  readonly browser: string;
  readonly debuggingPort: number;
  readonly delayExit: boolean;
  readonly name: string;
  readonly output: string;
  readonly retries: number;
  readonly skipResetMousePosition: boolean;
  readonly useSandboxForHeadless: boolean;
  readonly wipeBrowserCache: boolean;
}
