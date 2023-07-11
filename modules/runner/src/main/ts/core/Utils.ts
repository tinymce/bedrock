import { Suite, Test } from '@ephox/bedrock-common';
import Promise from '@ephox/wrap-promise-polyfill';
import sourceMappedStackTrace from 'sourcemapped-stacktrace';

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = (): void => {};

export const makeQueryParams = (session: string, offset: number, failed: number, skipped: number, retry: number): string => {
  if (offset > 0 || retry > 0 || skipped > 0) {
    const rt = (retry > 0 ? '&retry=' + retry : '');
    const sk = (skipped > 0 ? '&skipped=' + skipped : '');
    return '?session=' + session + '&offset=' + offset + '&failed=' + failed + sk + rt;
  } else {
    return '';
  }
};

export const makeUrl = (session: string, offset: number, failed: number, skipped: number, retry: number): string => {
  const baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
  return baseUrl + makeQueryParams(session, offset, failed, skipped, retry);
};

export const formatElapsedTime = (start: Date, end: Date): string => {
  const millis = end.getTime() - start.getTime();
  const seconds = Math.floor(millis / 1000);
  const point = Math.floor(millis - (seconds * 1000) / 100);
  const printable =
    point < 10 ? '00' + point :
      point < 100 ? '0' + point :
        '' + point;
  return seconds + '.' + printable + 's';
};

export const getFullTitle = (suiteOrTest: Suite | Test, separator: string): string => {
  const parentTitle = suiteOrTest.parent?.fullTitle();
  if (parentTitle !== undefined && parentTitle.length > 0) {
    return `${parentTitle} ${separator} ${suiteOrTest.title}`;
  } else {
    return suiteOrTest.title;
  }
};

export const makeSessionId = (): string => '' + Math.ceil((Math.random() * 100000000));

export const mapStackTrace = (stack: string | undefined): Promise<string> => new Promise((resolve) => {
  if (stack) {
    // If the stack trace format can't be found then an Error will be thrown.
    // In that case lets just return the original stack instead.
    try {
      sourceMappedStackTrace.mapStackTrace(stack, (stack) => resolve(stack.join('\n')));
    } catch (e) {
      resolve(stack);
    }
  } else {
    resolve('');
  }
});

export const setStack = (error: Error, stack: string | undefined): void => {
  try {
    error.stack = stack;
  } catch (err) {
    // Do nothing
  }
};