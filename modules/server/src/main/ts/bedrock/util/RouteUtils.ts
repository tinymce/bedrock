import * as etag from 'etag';
import * as fresh from 'fresh';
import { IncomingMessage, ServerResponse } from 'http';

export const generateETag = (data: any, weak = true) => etag(data, { weak });

export const isFresh = (request: IncomingMessage, response: ServerResponse) => fresh(request.headers, { etag: response.getHeader('ETag') });

export const isCachable = (status: number) => status >= 200 && status < 300;