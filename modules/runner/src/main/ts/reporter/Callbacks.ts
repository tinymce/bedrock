import { noop } from '../core/Utils';

export type onSuccessCallback = (data: any) => void;
export type onErrorCallback = (err: any) => void;

export interface Callbacks {
  readonly sendKeepAlive: (session: string, onSuccess: onSuccessCallback, onError: onErrorCallback) => void;
  readonly sendTestStart: (session: string, totalTests: number, file: string, name: string, onSuccess: onSuccessCallback, onError: onErrorCallback) => void;
  readonly sendTestResult: (session: string, file: string, name: string, passed: boolean, time: string, error: string | null, onSuccess: onSuccessCallback, onError: onErrorCallback) => void;
  readonly sendDone: (session: string, onSuccess: onSuccessCallback, onError: onErrorCallback) => void;
}

declare const $: JQueryStatic;

const Global: any = window;

const sendJson = (url: string, data: any, onSuccess: onSuccessCallback = noop, onError: onErrorCallback = noop): void => {
  $.ajax({
    method: 'post',
    url,
    dataType: 'json',
    success: onSuccess,
    error: onError,
    data: JSON.stringify(data),
  });
};

export const Callbacks = (): Callbacks => {
  const sendKeepAlive = (session: string, onSuccess: onSuccessCallback, onError: onErrorCallback): void => {
    sendJson('/tests/alive', {
      session,
    }, onSuccess, onError);
  };

  const sendTestStart = (session: string, totalTests: number, file: string, name: string, onSuccess: onSuccessCallback, onError: onErrorCallback): void => {
    sendJson('/tests/start', {
      totalTests,
      session,
      file,
      name,
    }, onSuccess, onError);
  };

  const sendTestResult = (session: string, file: string, name: string, passed: boolean, time: string, error: string | null, onSuccess: onSuccessCallback, onError: onErrorCallback): void => {
    sendJson('/tests/result', {
      session,
      file,
      name,
      passed,
      time,
      error,
    }, onSuccess, onError);
  };

  const sendDone = (session: string, onSuccess: onSuccessCallback, onError: onErrorCallback): void => {
    // webpack makes this available
    const getCoverage = (): Record<string, any> => typeof Global.__coverage__ === 'undefined' ? {} : Global.__coverage__;

    sendJson('/tests/done', {
      session,
      coverage: getCoverage(),
    }, onSuccess, onError);
  };

  return {
    sendKeepAlive,
    sendTestStart,
    sendTestResult,
    sendDone
  };
};