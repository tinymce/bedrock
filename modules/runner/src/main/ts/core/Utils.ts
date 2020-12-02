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

export const makeSessionId = (): string => '' + Math.ceil((Math.random() * 100000000));