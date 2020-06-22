import { noop } from '../core/Utils';

export type onSuccessCallback = (data: any) => void;
export type onErrorCallback = (err: any) => void;

export interface Callbacks {
  sendKeepAlive: (session: string, onSuccess: onSuccessCallback, onError: onErrorCallback) => void;
  sendTestStart: (session: string, totalTests: number, file: string, name: string, onSuccess: onSuccessCallback, onError: onErrorCallback) => void;
  sendTestResult: (session: string, file: string, name: string, passed: boolean, time: string, error: string | null, onSuccess: onSuccessCallback, onError: onErrorCallback) => void;
  sendDone: (session: string, onSuccess: onSuccessCallback, onError: onErrorCallback) => void;
}

declare const $: JQueryStatic;

const Global: any = window;

const sendJson = (url: string, data: any, onSuccess: onSuccessCallback = noop, onError: onErrorCallback = noop): void => {
  $.ajax({
    method: 'post',
    url: url,
    dataType: 'json',
    success: onSuccess,
    error: onError,
    data: JSON.stringify(data),
  });
};

export const Callbacks = (): Callbacks => {
  const sendKeepAlive = (session: string, onSuccess: onSuccessCallback, onError: onErrorCallback): void => {
    sendJson('/tests/alive', {
      session: session,
    }, onSuccess, onError);
  };

  const sendTestStart = (session: string, totalTests: number, file: string, name: string, onSuccess: onSuccessCallback, onError: onErrorCallback): void => {
    sendJson('/tests/start', {
      totalTests,
      session: session,
      file: file,
      name: name,
    }, onSuccess, onError);
  };

  const sendTestResult = (session: string, file: string, name: string, passed: boolean, time: string, error: string | null, onSuccess: onSuccessCallback, onError: onErrorCallback): void => {
    sendJson('/tests/result', {
      session: session,
      file: file,
      name: name,
      passed: passed,
      time: time,
      error: error,
    }, onSuccess, onError);
  };

  const sendDone = (session: string, onSuccess: onSuccessCallback, onError: onErrorCallback): void => {
    // webpack makes this available
    const getCoverage = (): Record<string, any> => typeof Global.__coverage__ === 'undefined' ? {} : Global.__coverage__;

    sendJson('/tests/done', {
      session: session,
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