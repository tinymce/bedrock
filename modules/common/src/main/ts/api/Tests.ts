import { Hook } from './Hooks';
import { LoggedError } from './LoggedError';

export type RunFn = (success: () => void, failure: (err: LoggedError) => void) => void;

export interface Test {
  readonly name: string;
  readonly test: RunFn;
  readonly suite: Suite;
}

export interface Suite {
  readonly name: string;
  readonly hooks?: Record<Hook, RunFn[]>;
  readonly parent?: Suite;
  readonly suites: Suite[];
  readonly tests: Test[];
}