import { IncomingMessage, ServerResponse } from 'http';
import * as path from 'path';
import * as Matchers from './Matchers';
import * as Obj from '../util/Obj';
import * as Type from '../util/Type';
import * as Routes from './Routes';
import * as FileUtils from '../util/FileUtils';

interface CustomRequest {
  headers?: Record<string, string>;
  method?: string;
  path?: string;
  url?: string;
  query?: Record<string, string>;
  json?: any;
}

interface CustomResponse {
  status?: number;
  headers?: Record<string, string>;
  json?: any;
  json_file?: string;
}

export interface CustomRouteSpec {
  request: CustomRequest;
  response: CustomResponse;
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

const assignContentType = (headers: Record<string, string>, contentType: string): Record<string, string> => {
  return Object.assign({}, {'content-type': contentType}, headers);
};

const concludeJson = (response: ServerResponse, status: number, headers: Record<string, string>, json: any) => {
  response.writeHead(status, assignContentType(headers, 'application/json'));
  response.end(serializeJson(json));
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

const fallbackGo = (filePath: string): Routes.RouteGoFunc => {
  return (request, response, done) => {
    response.writeHead(404, {'content-type': 'text/plain'});
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

const go = (filePath: string): Routes.RouteGoFunc => {
  const fallback: Routes.Route = { matches: [], go: fallbackGo(filePath) };
  return (request, response, done) => {
    const routers = filePath ? jsonToRouters(FileUtils.readFileAsJson(filePath), filePath) : [];
    readRequestBody(request, (body) => {
      (request as any).body = body;
      Routes.route(routers, fallback, request, response, done);
    });
  };
};

const routers = (filePath: string) => {
  return [
    {
      matches: [Matchers.prefixMatch('/custom')],
      go: go(filePath)
    }
  ];
};

export const create = (filePath: string) => {
  return {
    routers: routers(filePath)
  };
};
