import * as Serve from '../server/Serve';
import { RspackOptions } from '@rspack/core';
import { Configuration } from 'webpack';

export interface DevServerServeSettings extends Serve.ServeSettings {
  readonly config: string;
  readonly coverage: string[];
  readonly polyfills: string[];
  readonly skipTypecheck: boolean;
}

export interface CompileArgs {
  readonly tsConfigFile: string;
  readonly scratchDir: string;
  readonly basedir: string;
  readonly exitOnCompileError: boolean;
  readonly srcFiles: string[];
  readonly coverage: string[];
  readonly polyfills: string[];
  readonly skipTypecheck: boolean;
}

export interface CompilerArgs extends CompileArgs {
  readonly bundler: Bundler;
}

export type WebpackCompileInfo = CompileInfo<Configuration>;
export type RspackCompileInfo = CompileInfo<RspackOptions>;

export interface CompileInfo<T> {
  readonly scratchFile: string;
  readonly dest: string;
  readonly config: T;
}

export type CompileFn = (args: CompileArgs) => Promise<string>;

export type Bundler = 'rspack' | 'webpack';
