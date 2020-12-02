import * as QS from 'querystringify';

export interface UrlParams {
  readonly session: string;
  readonly offset: number;
  readonly failed: number;
  readonly skipped: number;
  retry: number;
}

const nat = (str: string | undefined): number => {
  if (typeof str === 'string') {
    const num = parseInt(str, 10);
    if (!isNaN(num) && num > 0) {
      return num;
    }
  }
  return 0;
};

const parse = (search: string, makeSessionId: () => string): UrlParams => {
  const params: {
    session?: string;
    offset?: string;
    failed?: string;
    skipped?: string;
    retry?: string;
  } = QS.parse(search);
  return {
    session: params.session || makeSessionId(),
    offset: nat(params.offset),
    failed: nat(params.failed),
    skipped: nat(params.skipped),
    retry: nat(params.retry),
  };
};

export const UrlParams = {
  parse,
  nat
};
