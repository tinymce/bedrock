// eslint-disable-next-line @typescript-eslint/no-require-imports
import etag = require('etag');
// eslint-disable-next-line @typescript-eslint/no-require-imports
import fresh = require('fresh');
import { IncomingMessage, ServerResponse } from 'http';

export const generateETag = (data: any, weak = true): string =>
  etag(data, { weak });

export const isFresh = (request: IncomingMessage, response: ServerResponse): boolean =>
  fresh(request.headers, { etag: response.getHeader('ETag') });

export const isCachable = (status: number): boolean =>
  status >= 200 && status < 300;