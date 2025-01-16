import * as fs from 'fs';
import { IncomingMessage, ServerResponse } from 'http';
import * as mime from 'mime-types';
import * as path from 'path';
import * as Matchers from './Matchers';
import * as Obj from '../util/Obj';
import * as Type from '../util/Type';
import * as Routes from './Routes';
import * as FileUtils from '../util/FileUtils';
import * as RouteUtils from '../util/RouteUtils';

interface CustomRequest {
  readonly headers?: Record<string, string>;
  readonly method?: string;
  readonly path?: string;
  readonly url?: string;
  readonly query?: Record<string, string>;
  readonly json?: any;
}

interface CustomResponse {
  readonly status?: number;
  readonly headers?: Record<string, string>;
  readonly json?: any;
  readonly json_file?: string;
  readonly binary_file?: string;
}

export interface CustomRouteSpec {
  readonly request: CustomRequest;
  readonly response: CustomResponse;
}

const readRequestBody = (request: IncomingMessage, done: (body: string) => void) => {
  let body = '';
  request.on('data', (data) => {
    body += data;
  });

  request.on('end', () => {
    done(body);
  });
};

const serializeJson = (json: any) => {
  return JSON.stringify(json, null, 2);
};

const matchesFromRequest = (matchRequest: CustomRequest) => {
  const matches = [];

  if (Type.isString(matchRequest.method)) {
    matches.push(Matchers.methodMatch(matchRequest.method));
  }

  if (Type.isString(matchRequest.url)) {
    matches.push(Matchers.urlMatch(matchRequest.url));
  }

  if (Type.isString(matchRequest.path)) {
    matches.push(Matchers.pathMatch(matchRequest.path));
  }

  if (Type.isObject(matchRequest.headers)) {
    matches.push(Matchers.headersMatch(matchRequest.headers));
  }

  if (Type.isObject(matchRequest.query)) {
    matches.push(Matchers.queryMatch(matchRequest.query));
  }

  if (!Type.isNull(matchRequest.json) && !Type.isUndefined(matchRequest.json)) {
    matches.push(Matchers.jsonBodyMatch(matchRequest.json));
  }

  return matches;
};

const parseJsonFromFile = (filePath: string, configPath: string) => {
  const resolvedFilePath = path.join(path.dirname(configPath), filePath);
  return FileUtils.readFileAsJson(resolvedFilePath);
};

const concludeJson = (response: ServerResponse, status: number, headers: Record<string, string>, json: any) => {
  const jsonString = serializeJson(json);
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=60',
    'ETag': RouteUtils.generateETag(jsonString),
    ...headers
  });
  response.end(jsonString);
};

const concludeBinary = (response: ServerResponse, status: number, headers: Record<string, string>, filepath: string) => {
  const contentType = mime.contentType(path.extname(filepath)) || 'application/octet-stream';
  const stats = fs.statSync(filepath);
  response.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': stats.size,
    'ETag': RouteUtils.generateETag(stats),
    'Last-Modified': stats.mtime.toUTCString(),
    'Cache-Control': 'public, max-age=60',
    ...headers
  });
  const stream = fs.createReadStream(filepath);
  stream.pipe(response);
};

const goFromResponse = (matchResponse: CustomResponse, configPath: string): Routes.RouteGoFunc => {
  return (request, response/* , done */) => {
    const headers = matchResponse.headers ? Obj.toLowerCaseKeys(matchResponse.headers) : { };
    const status = matchResponse.status ? matchResponse.status : 200;

    if (!Type.isNull(matchResponse.json) && !Type.isUndefined(matchResponse.json)) {
      concludeJson(response, status, headers, matchResponse.json);
    } else if (Type.isString(matchResponse.json_file)) {
      const json = parseJsonFromFile(matchResponse.json_file, configPath);
      concludeJson(response, status, headers, json);
    } else if (Type.isString(matchResponse.binary_file)) {
      const resolvedFilePath = path.join(path.dirname(configPath), matchResponse.binary_file);
      concludeBinary(response, status, headers, resolvedFilePath);
    }
  };
};

const jsonToRouters = (data: CustomRouteSpec[], configPath: string) => {
  return data.map((staticRouter) => {
    return {
      matches: matchesFromRequest(staticRouter.request),
      go: goFromResponse(staticRouter.response, configPath)
    };
  });
};

const fallbackGo = (filePath: string | undefined): Routes.RouteGoFunc => {
  return (request, response, done) => {
    response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
    response.end([
      'Could not find a matching custom route for: ',
      'Method: ' + request.method,
      'Url: ' + request.url,
      'Body: ' + (request as any).body, // Patched in below
      'Config: ' + (filePath ? filePath : 'No config file provided')
    ].join('\n'));
    done();
  };
};

const go = (filePath: string | undefined): Routes.RouteGoFunc => {
  const fallback: Routes.Route = { matches: [], go: fallbackGo(filePath) };
  return (request, response, done) => {
    const routers = filePath ? jsonToRouters(FileUtils.readFileAsJson(filePath), filePath) : [];
    readRequestBody(request, (body) => {
      (request as any).body = body;
      Routes.route(routers, fallback, request, response, done);
    });
  };
};

const routers = (filePath: string | undefined) => {
  return [
    {
      matches: [Matchers.prefixMatch('/custom')],
      go: go(filePath)
    }
  ];
};

export const create = (filePath: string | undefined): { routers: Routes.Route[] } => {
  return {
    routers: routers(filePath)
  };
};
