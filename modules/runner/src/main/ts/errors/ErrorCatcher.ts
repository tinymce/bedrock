import { Global, Type } from '@ephox/bedrock-common';
import { setStack } from '../core/Utils';
import { isInternalError } from './Errors';

type ErrorHandler = (error: Error) => void

export interface ErrorCatcher {
  readonly bind: (onError: ErrorHandler) => { unbind: () => void };
  readonly destroy: () => void;
}

// instanceof doesn't work with cross frame errors so we need
// to rely on duck-typing to check if we have an error
const isError = (e: unknown): e is Error =>
  Type.isObject(e) && (
    e instanceof Error ||
    Type.isString((e as Error).message) && Type.isString((e as Error).stack)
  );

export const ErrorCatcher = (): ErrorCatcher => {
  const supportsGlobalEventListeners = Global.addEventListener !== undefined;
  const onErrorHandlers: Set<ErrorHandler> = new Set();
  let bound = false;

  const createHandler = <T extends Event>(extractError: (e: T) => Error) => (e: T) => {
    if (onErrorHandlers.size > 0) {
      const error = extractError(e);
      onErrorHandlers.forEach((onError) => onError(error));
      e.preventDefault();
      return false;
    } else {
      return true;
    }
  };

  const onUnhandledRejection = createHandler((e: PromiseRejectionEvent) => {
    if (isError(e.reason)) {
      const error = new Error(`Unhandled promise rejection: ${e.reason.message}`);
      setStack(error, e.reason.stack);
      return error;
    } else {
      return new Error(`Unhandled promise rejection: ${e.reason}`);
    }
  });

  const onUncaughtError = createHandler((e: ErrorEvent) => {
    if (isError(e.error)) {
      if (isInternalError(e.error)) {
        return e.error;
      } else {
        const error = new Error(e.message);
        setStack(error, e.error.stack);
        return error;
      }
    } else {
      return new Error(`${e.message} (${e.filename}:${e.lineno})`);
    }
  });

  const bind = () => {
    if (supportsGlobalEventListeners && !bound) {
      bound = true;
      Global.addEventListener('error', onUncaughtError);
      Global.addEventListener('unhandledrejection', onUnhandledRejection);
    }
  };

  const unbind = () => {
    if (bound) {
      bound = false;
      Global.removeEventListener('error', onUncaughtError);
      Global.removeEventListener('unhandledrejection', onUnhandledRejection);
    }
  };

  const addHandler = (onError: ErrorHandler) => {
    onErrorHandlers.add(onError);
    bind();

    return {
      unbind: () => onErrorHandlers.delete(onError)
    };
  };

  return {
    bind: addHandler,
    destroy: unbind
  };
};