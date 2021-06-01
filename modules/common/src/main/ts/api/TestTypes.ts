import { TestError } from './TestError';
import { TestLabel } from './TestLabel';

export const enum HookType {
  Before = 'before',
  BeforeEach = 'beforeEach',
  After = 'after',
  AfterEach = 'afterEach'
}

export const enum RunnableState {
  NotRun = 'notrun',
  Passed = 'passed',
  Skipped = 'skipped',
  Failed = 'failed'
}

type SyncFn = (this: Context, done: (err?: TestLabel | TestError) => void) => void;
type AsyncFn = (this: Context) => PromiseLike<any>;

export type ExecuteFn = SyncFn | AsyncFn;

type StandaloneSuiteFn = (title: string, fn: (this: Suite) => void) => Suite;
type StandaloneTestFn = {
  (title: string, fn: SyncFn): Test;
  (title: string, fn: AsyncFn): Test;
};

export interface SuiteFn extends StandaloneSuiteFn {
  readonly only: StandaloneSuiteFn;
  readonly skip: StandaloneSuiteFn;
}

export interface TestFn extends StandaloneTestFn {
  readonly only: StandaloneTestFn;
  readonly skip: StandaloneTestFn;
}

export interface HookFn {
  (fn: SyncFn): void;
  (title: string, fn: SyncFn): void;
  (fn: AsyncFn): void;
  (title: string, fn: AsyncFn): void;
}

interface Common<R> {
  readonly skip: () => void;
  readonly retries: {
    (): number;
    (retries: number): R;
  };
  readonly slow: {
    (): number;
    (ms: number): R;
  };
  readonly timeout: {
    (): number;
    (ms: number): R;
  };
}

export interface Context extends Common<Runnable> {
  readonly current: Runnable;
  readonly currentTest?: Test;
}

export interface Runnable extends Common<Runnable> {
  error?: Error;
  readonly fn: ExecuteFn | undefined;
  readonly title: string;

  readonly isSkipped: () => boolean;
  readonly isFailed: () => boolean;
  readonly isPassed: () => boolean;
  readonly setResult: (state: RunnableState, e?: Error) => void;
  readonly _onChange: (type: 'retries' | 'slow' | 'timeout', callback: (value: number) => void) => () => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Hook extends Runnable {}

export interface Test extends Runnable {
  file?: string;
  readonly parent?: Suite;
  _only: boolean;

  readonly fullTitle: () => string;
}

export interface Suite {
  readonly hooks: Record<HookType, Hook[]>;
  readonly parent?: Suite;
  readonly root: boolean;
  suites: Suite[];
  tests: Test[];
  readonly title: string;
  _only: boolean;
  _skip: boolean;

  readonly fullTitle: () => string;
  readonly isSkipped: () => boolean;
}

export interface TestGlobals {
  readonly before: HookFn;
  readonly beforeEach: HookFn;
  readonly after: HookFn;
  readonly afterEach: HookFn;

  readonly describe: SuiteFn;
  readonly xdescribe: StandaloneSuiteFn;
  readonly context: SuiteFn;
  readonly xcontext: StandaloneSuiteFn;

  readonly it: TestFn;
  readonly xit: StandaloneTestFn;
  readonly specify: TestFn;
  readonly xspecify: StandaloneTestFn;
}
