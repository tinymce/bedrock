import { Global } from '@ephox/bedrock-common';
import { assert } from 'chai';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';
import { ErrorCatcher } from '../../../main/ts/errors/ErrorCatcher';

describe('ErrorCatcher', () => {
  const originalAddEventListener = Global.addEventListener;
  const originalRemoveEventListener = Global.removeEventListener;
  const eventHandlers: Record<string, Array<(e: Event) => void>> = {
    error: [],
    unhandledrejection: []
  };
  let errorCatcher: ErrorCatcher;
  let errors: Error[] = [];
  let unbind: () => void;

  before(() => {
    Global.addEventListener = (name: string, fn: (e: Event) => void) => {
      eventHandlers[name].push(fn);
    };
    Global.removeEventListener = (name: string, fn: (e: Event) => void) => {
      eventHandlers[name] = eventHandlers[name].filter((func) => func !== fn);
    };
    errorCatcher = ErrorCatcher();
  });

  after(() => {
    Global.addEventListener = originalAddEventListener;
    Global.removeEventListener = originalRemoveEventListener;
  });

  beforeEach(() => {
    unbind = errorCatcher.bind((e) => errors.push(e)).unbind;
  });

  afterEach(() => {
    unbind();
    errors = [];
  });

  const fireEvent = (name: string, event: Event) => {
    eventHandlers[name].forEach((fn) => fn(event));
  };

  it('should notify on unhandled exceptions (with error)', () => {
    let prevented = false;
    const err = new Error('message');
    const unhandledException = {
      message: 'Unhandled error: message',
      error: err,
      preventDefault: () => {
        prevented = true;
      }
    } as ErrorEvent;
    fireEvent('error', unhandledException);

    assert.lengthOf(errors, 1, 'Should contain one caught error');
    const error = errors[0];
    assert.equal(error.message, 'Unhandled error: message');
    assert.equal(error.stack, err.stack);
    assert.isTrue(prevented, 'Event should be prevented from running the default action');
  });

  it('should notify on unhandled exceptions (without error)', () => {
    let prevented = false;
    const unhandledException = {
      message: 'Unhandled error: message',
      lineno: 10,
      filename: 'ErrorFile.ts',
      preventDefault: () => {
        prevented = true;
      }
    } as ErrorEvent;
    fireEvent('error', unhandledException);

    assert.lengthOf(errors, 1, 'Should contain one caught error');
    const error = errors[0];
    assert.equal(error.message, 'Unhandled error: message (ErrorFile.ts:10)');
    assert.isTrue(prevented, 'Event should be prevented from running the default action');
  });

  it('should notify on unhandled promise rejection', () => {
    let prevented = false;
    const err = new Error('message');
    const unhandledPromiseRejection = {
      reason: err,
      preventDefault: () => {
        prevented = true;
      }
    } as PromiseRejectionEvent;
    fireEvent('unhandledrejection', unhandledPromiseRejection);

    assert.lengthOf(errors, 1, 'Should contain one caught error');
    const error = errors[0];
    assert.equal(error.message, 'Unhandled promise rejection: message');
    assert.equal(error.stack, err.stack);
    assert.isTrue(prevented, 'Event should be prevented from running the default action');
  });

  it('should not notify when there are no event listeners bound', () => {
    let prevented = false;
    const event = {
      preventDefault: () => {
        prevented = true;
      }
    } as Event;

    unbind();
    fireEvent('error', event);
    fireEvent('unhandledrejection', event);

    assert.lengthOf(errors, 0);
    assert.isFalse(prevented, 'Event should not be prevented from running the default action');
  });

  it('should handle cross frame errors', () => {
    let prevented = false;
    // Note: As this doesn't run in the browser we can't do a proper cross frame check so simulate an Error
    // that doesn't use the current Error prototype
    const frameError = {
      message: 'frame message',
      name: 'Error',
      stack: 'Error\n    at <anonymous>:1:1'
    };
    const unhandledException = {
      message: 'Unhandled error: frame message',
      error: frameError,
      preventDefault: () => {
        prevented = true;
      }
    } as ErrorEvent;
    fireEvent('error', unhandledException);

    assert.lengthOf(errors, 1, 'Should contain one caught error');
    const error = errors[0];
    assert.equal(error.message, 'Unhandled error: frame message');
    assert.equal(error.stack, frameError.stack);
    assert.isTrue(prevented, 'Event should be prevented from running the default action');
  });
});