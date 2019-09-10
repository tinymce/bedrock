import { IncomingMessage, ServerResponse } from 'http';
import * as server from 'serve-static';
import * as Matchers from './Matchers';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS';

export type RouteGoFunc = (request: IncomingMessage, response: ServerResponse, done: () => void) => void;
export interface Route {
  matches: Matchers.Matcher[];
  go: RouteGoFunc;
}

const createServer = (root: string) => {
  // Note: The serve-static types appear to be wrong here, so just force it back to what it should be
  return server(root) as (request: IncomingMessage, response: ServerResponse, done: (err?: any) => void) => void;
};

export const routing = (method: HTTPMethod, prefix: string, source: string): Route => {
  const router = createServer(source);

  const go: RouteGoFunc = (request, response, done) => {
    request.url = request.url.substring(prefix.length);
    router(request, response, done);
  };

  return {
    matches: [Matchers.methodMatch(method), Matchers.prefixMatch(prefix)],
    go
  };
};

const concludeJson = (response: ServerResponse, status: number, info: any) => {
  response.writeHead(status, {'Content-Type': 'application/json'});
  response.end(JSON.stringify(info));
};

export const json = (method: HTTPMethod, prefix: string, data: any): Route => {
  const go: RouteGoFunc = (request, response/* , done */) => {
    concludeJson(response, 200, data);
  };

  return {
    matches: [Matchers.methodMatch(method), Matchers.prefixMatch(prefix)],
    go
  };
};

export const asyncJs = (method: HTTPMethod, url: string, fn: ((data: any) => void)): Route => {
  const go: RouteGoFunc = (request, response/* , done */) => {
    fn((data: any) => {
      response.writeHead(200, {'Content-Type': 'text/javascript'});
      response.end(data);
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
        concludeJson(response, 200, {});
      }).catch((err) => {
        console.error('Executing effect failed: \n** ' + body);
        console.error('Error: ', err, '\n');
        concludeJson(response, 500, {});
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
    const original = request.url;
    request.url = original.substring((prefix + '/').length);
    base(request, response, done);
  };

  return {
    matches: [Matchers.methodMatch(method), Matchers.prefixMatch(prefix)],
    go
  };
};

export const unsupported = (method: HTTPMethod, root: string, label: string): Route => {
  const go: RouteGoFunc = (request, response/* , done */) => {
    concludeJson(response, 404, {error: label});
  };

  return {
    matches: [Matchers.methodMatch(method), Matchers.prefixMatch(root)],
    go
  };
};

export const route = (routes: Route[], fallback: Route, request: IncomingMessage, response: ServerResponse, done: (err?: any) => void) => {
  (request as any).originalUrl = request.url;

  const match = routes.find((candidate) => {
    return candidate.matches.every((match) => {
      return match(request);
    });
  });

  const matching = match === undefined ? fallback : match;
  matching.go(request, response, done);
};
