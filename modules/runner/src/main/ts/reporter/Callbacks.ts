import { ErrorData, Global } from '@ephox/bedrock-common';

import { HarnessResponse } from '../core/ServerTypes';

export interface TestReport {
  readonly file: string;
  readonly name: string;
  readonly passed: boolean;
  readonly time: string;
  readonly skipped: string | null;
  readonly error: TestErrorData | null
}

export interface TestErrorData {
  readonly data: ErrorData;
  readonly text: string;
}

export interface Callbacks {
  readonly loadHarness: () => Promise<HarnessResponse>
  readonly sendKeepAlive: (session: string) => Promise<void>;
  readonly sendInit: (session: string) => Promise<void>;
  readonly sendTestStart: (session: string, number: number, totalTests: number, file: string, name: string) => Promise<void>;
  readonly sendTestResults: (session: string, results: TestReport[]) => Promise<void>;
  readonly sendDone: (session: string, error?: string) => Promise<void>;
}

declare const $: JQueryStatic;

function generateErrorMessage(xhr: JQuery.jqXHR<any>, onError: (reason?: any) => void, url: string, requestDetails: string, statusText: 'timeout' | 'error' | 'abort' | 'parsererror', e: string) {
  if (xhr.readyState === 0) {
    onError(`Unable to open connection to ${url}, ${requestDetails}. Status text "${statusText}", error thrown "${e}"`);
  } else {
    onError(`Response status ${xhr.status} connecting to ${url}, ${requestDetails}. Status text "${statusText}", error thrown "${e}"`);
  }
}

const sendJson = <T>(url: string, jsonData: any): Promise<T> => {
  return new Promise((onSuccess, onError) => {
    const data = JSON.stringify(jsonData);
    $.ajax({
      method: 'post',
      url,
      contentType: 'application/json; charset=UTF-8',
      dataType: 'json',
      success: onSuccess,
      error: (xhr, statusText, e) => {
        generateErrorMessage(xhr, onError, url, `sending ${data}`, statusText, e);
      },
      data,
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
        generateErrorMessage(xhr, onError, url, 'as a get request', statusText, e);
      }
    });
  }));
};

export const Callbacks = (): Callbacks => {
  const loadHarness = (): Promise<HarnessResponse> => {
    return getJson('harness');
  };

  const sendInit = (session: string): Promise<void> => {
    return sendJson('/tests/init', {
      session,
    });
  };

  const sendKeepAlive = (session: string): Promise<void> => {
    return sendJson('/tests/alive', {
      session,
    });
  };

  const sendTestStart = (session: string, number: number, totalTests: number, file: string, name: string): Promise<void> => {
    return sendJson('/tests/start', {
      number,
      totalTests,
      session,
      file,
      name,
    });
  };

  const sendTestResults = (session: string, results: TestReport[]): Promise<void> => {
    return sendJson('/tests/results', {
      session,
      results,
    });
  };

  const sendDone = (session: string, error?: string): Promise<void> => {
    // webpack makes this available
    const getCoverage = (): Record<string, any> => typeof Global.__coverage__ === 'undefined' ? {} : Global.__coverage__;

    return sendJson('/tests/done', {
      session,
      error,
      coverage: getCoverage(),
    });
  };

  return {
    loadHarness,
    sendInit,
    sendKeepAlive,
    sendTestStart,
    sendTestResults,
    sendDone
  };
};
