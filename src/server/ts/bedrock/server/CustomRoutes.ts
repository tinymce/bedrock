import * as path from 'path';
import * as Matchers from './Matchers';
import * as Obj from '../util/Obj';
import * as Type from '../util/Type';
import * as Routes from './Routes';
import * as FileUtils from '../util/FileUtils';

const readRequestBody = function (request, done) {
  let body = '';
  request.on('data', function (data) {
    body += data;
  });

  request.on('end', function () {
    done(body);
  });
};


const serializeJson = function (json) {
  return JSON.stringify(json, null, 2);
};

const matchesFromRequest = function (matchRequest) {
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

  if (Type.isObject(matchRequest.json)) {
    matches.push(Matchers.jsonBodyMatch(matchRequest.json));
  }

  return matches;
};

const parseJsonFromFile = function (filePath, configPath) {
  const resolvedFilePath = path.join(path.dirname(configPath), filePath);
  return FileUtils.readFileAsJson(resolvedFilePath);
};

const assignContentType = function (headers, contentType) {
  return Object.assign({}, {'content-type': contentType}, headers);
};

const goFromResponse = function (matchResponse, configPath) {
  return function (request, response/* , done */) {
    const headers = matchResponse.headers ? Obj.toLowerCaseKeys(matchResponse.headers) : { };
    const status = matchResponse.status ? matchResponse.status : 200;

    if (Type.isString(matchResponse.json_file) || Type.isObject(matchResponse.json)) {
      response.writeHead(status, assignContentType(headers, 'application/json'));
      const json = Type.isObject(matchResponse.json) ? matchResponse.json : parseJsonFromFile(matchResponse.json_file, configPath);
      response.end(serializeJson(json));
    }
  };
};

const jsonToRouters = function (data, configPath) {
  return data.map(function (staticRouter) {
    return {
      matches: matchesFromRequest(staticRouter.request),
      go: goFromResponse(staticRouter.response, configPath)
    };
  });
};

const fallbackGo = function (filePath) {
  return function (request, response, done) {
    response.writeHead(404, {'content-type': 'application/json'});
    response.end([
      'Could not find a matching custom route for: ',
      'Method: ' + request.method,
      'Url: ' + request.url,
      'Body:' + request.body,
      'Config: ' + (filePath ? filePath : 'No config file provided')
    ].join('\n'));
    done();
  };
};

const go = function (filePath) {
  const fallback = {matching: [], go: fallbackGo(filePath)};
  return function (request, response, done) {
    const routers = filePath ? jsonToRouters(FileUtils.readFileAsJson(filePath), filePath) : [];
    readRequestBody(request, function (body) {
      request.body = body;
      Routes.route(routers, fallback, request, response, done);
    });
  };
};

const routers = function (filePath) {
  return [
    {
      matches: [Matchers.prefixMatch('/custom')],
      go: go(filePath)
    }
  ];
};

export const create = function (filePath) {
  return {
    routers: routers(filePath)
  };
};
