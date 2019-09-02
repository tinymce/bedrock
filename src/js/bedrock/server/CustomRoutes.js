const fs = require('fs');
const path = require('path');
const matchers = require('./matchers');
const obj = require('../util/obj');
const type = require('../util/type');
const routes = require('./routes');

const readRequestBody = function (request, done) {
  let body = '';
  request.on('data', function (data) {
    body += data;
  });

  request.on('end', function () {
    done(body);
  });
};

const parseJson = function (filePath) {
  const contents = fs.readFileSync(filePath);
  const data = JSON.parse(contents);
  return data;
};

const serializeJson = function (json) {
  return JSON.stringify(json, null, 2);
};

const matchesFromRequest = function (matchRequest) {
  const matches = [];

  if (type.isString(matchRequest.method)) {
    matches.push(matchers.methodMatch(matchRequest.method));
  }

  if (type.isString(matchRequest.url)) {
    matches.push(matchers.urlMatch(matchRequest.url));
  }

  if (type.isString(matchRequest.path)) {
    matches.push(matchers.pathMatch(matchRequest.path));
  }

  if (type.isObject(matchRequest.headers)) {
    matches.push(matchers.headersMatch(matchRequest.headers));
  }

  if (type.isObject(matchRequest.query)) {
    matches.push(matchers.queryMatch(matchRequest.query));
  }

  if (type.isObject(matchRequest.json)) {
    matches.push(matchers.jsonBodyMatch(matchRequest.json));
  }

  return matches;
};

const parseJsonFromFile = function (filePath, configPath) {
  const resolvedFilePath = path.join(path.dirname(configPath), filePath);
  return parseJson(resolvedFilePath);
};

const assignContentType = function (headers, contentType) {
  return Object.assign({}, {'content-type': contentType}, headers);
};

const goFromResponse = function (matchResponse, configPath) {
  return function (request, response/* , done */) {
    const headers = matchResponse.headers ? obj.toLowerCaseKeys(matchResponse.headers) : { };
    const status = matchResponse.status ? matchResponse.status : 200;

    if (type.isString(matchResponse.json_file) || type.isObject(matchResponse.json)) {
      response.writeHead(status, assignContentType(headers, 'application/json'));
      const json = type.isObject(matchResponse.json) ? matchResponse.json : parseJsonFromFile(matchResponse.json_file, configPath);
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
    const routers = filePath ? jsonToRouters(parseJson(filePath), filePath) : [];
    readRequestBody(request, function (body) {
      request.body = body;
      routes.route(routers, fallback, request, response, done);
    });
  };
};

const routers = function (filePath) {
  return [
    {
      matches: [matchers.prefixMatch('/custom')],
      go: go(filePath)
    }
  ];
};

const create = function (filePath) {
  return {
    routers: routers(filePath)
  };
};

module.exports = {
  create: create
};
