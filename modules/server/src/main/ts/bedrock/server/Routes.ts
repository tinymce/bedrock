import { IncomingMessage, ServerResponse } from 'http';
import * as server from 'serve-static';
import * as RouteUtils from '../util/RouteUtils';
import * as Matchers from './Matchers';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS';

export type RouteGoFunc = (request: IncomingMessage, response: ServerResponse, done: () => void) => void;
export interface Route {
  readonly matches: Matchers.Matcher[];
  readonly go: RouteGoFunc;
}

export interface Runner {
  readonly routers: Route[];
  readonly fallback: Route;
}

const createServer = (root: string) => {
  // Note: The serve-static types appear to be wrong here, so just force it back to what it should be
  return server(root) as (request: IncomingMessage, response: ServerResponse, done: (err?: any) => void) => void;
};

const doResponse = (request: IncomingMessage, response: ServerResponse, status: number, contentType: string, data: any) => {
  response.setHeader('ETag', RouteUtils.generateETag(data));
  if (status === 304 || RouteUtils.isCachable(status) && RouteUtils.isFresh(request, response)) {
    response.writeHead(304, { });
    response.end();
  } else {
    response.writeHead(status, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=0'
    });
    response.end(data);
  }
};

export const routing = (method: HTTPMethod, prefix: string, source: string): Route => {
  const router = createServer(source);

  const go: RouteGoFunc = (request, response, done) => {
    if (request.url) {
      request.url = request.url.substring(prefix.length);
    }
    router(request, response, done);
  };

  return {
    matches: [Matchers.methodMatch(method), Matchers.prefixMatch(prefix)],
    go
  };
};

const concludeJson = (request: IncomingMessage, response: ServerResponse, status: number, info: any) => {
  doResponse(request, response, status, 'application/json', JSON.stringify(info));
};

export const json = (method: HTTPMethod, prefix: string, data: any): Route => {
  const go: RouteGoFunc = (request, response/* , done */) => {
    concludeJson(request, response, 200, data);
  };

  return {
    matches: [Matchers.methodMatch(method), Matchers.prefixMatch(prefix)],
    go
  };
};

export const asyncJs = (method: HTTPMethod, url: string, fn: ((data: any) => void)): Route => {
  const go: RouteGoFunc = (request, response/* , done */) => {
    fn((data: any) => {
      doResponse(request, response, 200, 'application/javascript', data);
    });
  };

  return {
    matches: [Matchers.methodMatch(method), Matchers.urlMatch(url)],
    go
  };
};

export const effect = <D>(method: HTTPMethod, prefix: string, action: (data: D) => Promise<void>): Route => {
  const go: RouteGoFunc = (request, response/* , done */) => {
    let body = '';
    request.on('data', (data) => {
      body += data;
    });

    request.on('end', () => {
      const parsed = JSON.parse(body);
      action(parsed).then(() => {
        concludeJson(request, response, 200, {});
      }).catch((err) => {
        console.error('Executing effect failed: \n** ' + body);
        console.error('Error: ', err, '\n');
        concludeJson(request, response, 500, {});
      });
    });
  };

  return {
    matches: [Matchers.methodMatch(method), Matchers.prefixMatch(prefix)],
    go
  };
};

export const rewrite = (method: HTTPMethod, root: string, input: string, output: string): Route => {
  const base = createServer(root);

  const go: RouteGoFunc = (request, response, done) => {
    request.url = output;
    base(request, response, done);
  };

  return {
    matches: [Matchers.methodMatch(method), Matchers.prefixMatch(input)],
    go
  };
};

export const constant = (method: HTTPMethod, root: string, url: string): Route => {
  const base = createServer(root);

  const go: RouteGoFunc = (request, response, done) => {
    request.url = url;
    base(request, response, done);
  };

  return {
    matches: [Matchers.methodMatch(method), Matchers.prefixMatch(root)],
    go
  };
};

export const host = (method: HTTPMethod, root: string): Route => {
  const base = createServer(root);

  const go: RouteGoFunc = (request, response, done) => {
    base(request, response, done);
  };

  return {
    matches: [Matchers.methodMatch(method), Matchers.prefixMatch(root)],
    go
  };
};

export const hostOn = (method: HTTPMethod, prefix: string, root: string): Route => {
  const base = createServer(root);

  const go: RouteGoFunc = (request, response, done) => {
    if (request.url) {
      request.url = request.url.substring((prefix + '/').length);
    }
    base(request, response, done);
  };

  return {
    matches: [Matchers.methodMatch(method), Matchers.prefixMatch(prefix)],
    go
  };
};

export const unsupported = (method: HTTPMethod, root: string, label: string): Route => {
  const go: RouteGoFunc = (request, response/* , done */) => {
    concludeJson(request, response, 404, { error: label });
  };

  return {
    matches: [Matchers.methodMatch(method), Matchers.prefixMatch(root)],
    go
  };
};

export const route = (routes: Route[], fallback: Route, request: IncomingMessage, response: ServerResponse, done: (err?: any) => void): void => {
  (request as any).originalUrl = request.url;

  const match = routes.find((candidate) => {
    return candidate.matches.every((match) => {
      return match(request as IncomingMessage & { originalUrl: string });
    });
  });

  const matching = match === undefined ? fallback : match;
  matching.go(request, response, done);
};
