import { Global } from '@ephox/bedrock-common';
import Promise from '@ephox/wrap-promise-polyfill';
import { HarnessResponse } from '../core/ServerTypes';

export interface Callbacks {
  readonly loadHarness: () => Promise<HarnessResponse>
  readonly sendKeepAlive: (session: string) => Promise<void>;
  readonly sendTestStart: (session: string, totalTests: number, file: string, name: string) => Promise<void>;
  readonly sendTestResult: (session: string, file: string, name: string, passed: boolean, time: string, error: string | null, skipped: string | null) => Promise<void>;
  readonly sendDone: (session: string) => Promise<void>;
}

declare const $: JQueryStatic;

const sendJson = <T>(url: string, data: any): Promise<T> => {
  return new Promise((onSuccess, onError) => {
    $.ajax({
      method: 'post',
      url,
      contentType: 'application/json; charset=UTF-8',
      dataType: 'json',
      success: onSuccess,
      error: (xhr, statusText, e) => {
        onError(e);
      },
      data: JSON.stringify(data),
    });
  });
};

const getJson = <T>(url: string): Promise<T> => {
  return new Promise(((onSuccess, onError) => {
    $.ajax({
      url,
      dataType: 'json',
      success: onSuccess,
      error: (xhr, statusText, e) => {
        onError(e);
      }
    });
  }));
};

export const Callbacks = (): Callbacks => {
  const loadHarness = (): Promise<HarnessResponse> => {
    return getJson('harness');
  };

  const sendKeepAlive = (session: string): Promise<void> => {
    return sendJson('/tests/alive', {
      session,
    });
  };

  const sendTestStart = (session: string, totalTests: number, file: string, name: string): Promise<void> => {
    return sendJson('/tests/start', {
      totalTests,
      session,
      file,
      name,
    });
  };

  const sendTestResult = (session: string, file: string, name: string, passed: boolean, time: string, error: string | null, skipped: string | null): Promise<void> => {
    return sendJson('/tests/result', {
      session,
      file,
      name,
      passed,
      skipped,
      time,
      error,
    });
  };

  const sendDone = (session: string): Promise<void> => {
    // webpack makes this available
    const getCoverage = (): Record<string, any> => typeof Global.__coverage__ === 'undefined' ? {} : Global.__coverage__;

    return sendJson('/tests/done', {
      session,
      coverage: getCoverage(),
    });
  };

  return {
    loadHarness,
    sendKeepAlive,
    sendTestStart,
    sendTestResult,
    sendDone
  };
};