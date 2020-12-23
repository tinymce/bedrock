import { TestError, TestThrowable } from '@ephox/bedrock-common';

export type InternalError = SkipError | MultipleDone;

export class SkipError extends Error implements TestError.JsError {
  constructor(message?: string) {
    super(message);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, SkipError.prototype);
  }
}

export class MultipleDone extends Error implements TestError.JsError {
  public original: TestThrowable | undefined;

  constructor(message?: string, original?: TestThrowable) {
    super(message);
    this.original = original;
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, MultipleDone.prototype);
  }
}

export const isInternalError = (err: Error): boolean => {
  return err instanceof SkipError || err instanceof MultipleDone;
};