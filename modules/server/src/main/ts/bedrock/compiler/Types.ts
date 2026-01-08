import * as Serve from '../server/Serve.js';
import { RspackOptions } from '@rspack/core';
import { Configuration } from 'webpack';

export interface DevServerServeSettings extends Serve.ServeSettings {
  readonly config: string;
  readonly coverage: string[];
  readonly polyfills: string[];
}

export type WebpackCompileInfo = CompileInfo<Configuration>;
export type RspackCompileInfo = CompileInfo<RspackOptions>;

export interface CompileInfo<T> {
  readonly scratchFile: string;
  readonly dest: string;
  readonly config: T;
}

export type CompileFn = (
  tsConfigFile: string,
  scratchDir: string,
  basedir: string,
  exitOnCompileError: boolean,
  srcFiles: string[],
  coverage: string[],
  polyfills: string[]
) => Promise<string>;

export type Bundler = 'rspack' | 'webpack';
