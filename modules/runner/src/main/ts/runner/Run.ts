import { Context, ExecuteFn, Failure, LoggedError, Runnable, RunnableState, TestThrowable, Type } from '@ephox/bedrock-common';
import { isInternalError, MultipleDone, SkipError } from '../errors/Errors';
import { ErrorCatcher } from '../errors/ErrorCatcher';
import { Timer } from './Timer';

type LoggedError = LoggedError.LoggedError;

const isPromiseLike = (value: unknown | undefined): value is PromiseLike<any> =>
  value !== undefined && (value as PromiseLike<any>).then !== undefined;

// Promises can be rejected, and values thrown, with anything at all - including nothing - so
// substitute an error for the values that can't be reported on
const normalizeThrowable = (e: unknown): TestThrowable =>
  Type.isObject(e) || Type.isString(e) || typeof e === 'function'
    ? e as TestThrowable
    : new Error(`Failed with no or falsy error: ${e}`);

const errorCatcher = ErrorCatcher();

// Errors that arrive while no runnable is executing are otherwise lost, as there's nothing left to
// fail. They still need reporting, so hand them to the runner to attribute to whatever ran last.
export const catchStrayErrors = (onError: (e: LoggedError) => void): void => {
  errorCatcher.bindFallback((e) => onError(Failure.prepFailure(e)));
};

export const runWithErrorCatcher = <T>(runnable: Runnable, fn: () => Promise<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    let errorOccurred = false;
    const catcher = errorCatcher.bind((e) => {
      if (!errorOccurred) {
        errorOccurred = true;
        const err = isInternalError(e) ? e : Failure.prepFailure(e);
        runnable.setResult(RunnableState.Failed, err);
        reject(err);
      }
    });

    fn().then((result) => {
      catcher.unbind();
      if (!errorOccurred) {
        resolve(result);
      }
    }, (e) => {
      catcher.unbind();
      if (!errorOccurred) {
        reject(e);
      }
    });
  });
};

const runExecFn = (fn: ExecuteFn, context: Context): Promise<void> => {
  return new Promise((resolve, reject) => {
    let doneCalled = false;
    const done = (err?: TestThrowable) => {
      if (doneCalled) {
        throw new MultipleDone('done() called multiple times', err);
      } else if (err !== undefined) {
        reject(Failure.prepFailure(err));
      } else {
        resolve();
      }
      doneCalled = true;
    };

    try {
      // If the function has 1 or more arguments, it's using the async callback
      const retValue: any = fn.call(context, done);
      if (fn.length === 0) {
        if (isPromiseLike(retValue)) {
          retValue.then(() => done(), (e) => done(normalizeThrowable(e)));
        } else {
          resolve();
        }
      }
    } catch (e) {
      const err = isInternalError(e) ? e : Failure.prepFailure(normalizeThrowable(e));
      reject(err);
    }
  });
};

export const run = (runnable: Runnable, context: Context): Promise<void> => {
  // Ensure we don't run if we already have a result or don't have anything to run
  if (runnable.isFailed()) {
    return Promise.reject(runnable.error);
  } else if (runnable.isSkipped()) {
    return Promise.reject(new SkipError());
  } else if (runnable.fn === undefined) {
    return Promise.resolve();
  } else {
    return runExecFn(runnable.fn, context).catch((e) => {
      // Update the runnable state when an error occurs
      if (e instanceof SkipError) {
        runnable.setResult(RunnableState.Skipped);
      } else {
        runnable.setResult(RunnableState.Failed, e);
      }
      return Promise.reject(e);
    });
  }
};

const runWithCleanup = (runnable: Runnable, context: Context, cleanup: () => void): Promise<void> =>
  run(runnable, context).then(cleanup, (e) => {
    cleanup();
    return Promise.reject(e);
  });

export const runWithTimeout = (runnable: Runnable, context: Context, defaultTimeout: number): Promise<void> => {
  // Update the runnable timeout to use the default timeout if required
  if (runnable.timeout() === -1) {
    runnable.timeout(defaultTimeout);
  }

  // Run the execute function with a timeout if required
  if (runnable.timeout() <= 0) {
    return run(runnable, context);
  } else {
    return new Promise((resolve, reject) => {
      const timer = Timer();

      const resolveIfNotTimedOut = () => {
        if (!timer.hasTimedOut()) {
          resolve();
        }
      };

      // If the runnable sets a timeout while running then we need to restart the timer
      const unbind = runnable._onChange('timeout', timer.restart);

      // Start the timer
      timer.start(runnable.timeout(), () => {
        unbind();
        reject(Failure.prepFailure(new Error(`Test ran too long - timeout of ${runnable.timeout()}ms exceeded`)));
      });

      // Run the execute function and clean up after it's completed
      runWithCleanup(runnable, context, () => {
        timer.stop();
        unbind();
      }).then(resolveIfNotTimedOut, reject);
    });
  }
};
