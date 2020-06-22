export const noop = (): void => {};

export const makeUrl = (session: string, offset: number, failed: number, retry: number): string => {
  const baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
  if (offset > 0) {
    const rt = (retry > 0 ? '&retry=' + retry : '');
    return baseUrl + '?session=' + session + '&offset=' + offset + '&failed=' + failed + rt;
  } else {
    return baseUrl;
  }
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