import * as etag from 'etag';
import * as fresh from 'fresh';
import { IncomingMessage, ServerResponse } from 'http';

export const generateETag = (data: any, weak = true): string =>
  etag(data, { weak });

export const isFresh = (request: IncomingMessage, response: ServerResponse): boolean =>
  fresh(request.headers, { etag: response.getHeader('ETag') });

export const isCachable = (status: number): boolean =>
  status >= 200 && status < 300;