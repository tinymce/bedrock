var fs = require('fs');
var path = require('path');
var matchers = require('./matchers');
var obj = require('../util/obj');
var routes = require('./routes');

var readRequestBody = function (request, done) {
  var body = '';
  request.on('data', function (data) {
    body += data;
  });

  request.on('end', function () {
    done(body);
  });
};

var parseJson = function (filePath) {
  var contents = fs.readFileSync(filePath);
  var data = JSON.parse(contents);
  return data;
};

var serializeJson = function (json) {
  return JSON.stringify(json, null, 2);
};

var matchesFromRequest = function (matchRequest) {
  var matches = [];

  if (typeof matchRequest.method === 'string') {
    matches.push(matchers.methodMatch(matchRequest.method));
  }

  if (typeof matchRequest.url === 'string') {
    matches.push(matchers.urlMatch(matchRequest.url));
  }

  if (typeof matchRequest.path === 'string') {
    matches.push(matchers.pathMatch(matchRequest.path));
  }

  if (typeof matchRequest.headers === 'object') {
    matches.push(matchers.headersMatch(matchRequest.headers));
  }

  if (typeof matchRequest.query === 'object') {
    matches.push(matchers.queryMatch(matchRequest.query));
  }

  if (typeof matchRequest.json === 'object') {
    matches.push(matchers.jsonBodyMatch(matchRequest.json));
  }

  return matches;
};

var parseJsonFromFile = function (filePath, configPath) {
  var resolvedFilePath = path.join(path.dirname(configPath), filePath);
  return parseJson(resolvedFilePath);
};

var assignContentType = function (headers, contentType) {
  return Object.assign({}, {'content-type': contentType}, headers);
};

var goFromResponse = function (matchResponse, configPath) {
  return function (request, response/* , done */) {
    var headers = matchResponse.headers ? obj.toLowerCaseKeys(matchResponse.headers) : { };
    var status = matchResponse.status ? matchResponse.status : 200;

    if (matchResponse.json_file !== undefined || matchResponse.json !== undefined) {
      response.writeHead(status, assignContentType(headers, 'application/json'));
      var json = typeof matchResponse.json === 'string' ? matchResponse.json : parseJsonFromFile(matchResponse.json_file, configPath);
      response.end(serializeJson(json));
    }
  };
};

var jsonToRouters = function (data, configPath) {
  return data.map(function (staticRouter) {
    return {
      matches: matchesFromRequest(staticRouter.request),
      go: goFromResponse(staticRouter.response, configPath)
    };
  });
};

var fallbackGo = function (filePath) {
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

var go = function (filePath) {
  var fallback = { matching: [], go: fallbackGo(filePath) };
  return function (request, response, done) {
    var routers = filePath ? jsonToRouters(parseJson(filePath), filePath) : [ ];
    readRequestBody(request, function (body) {
      request.body = body;
      routes.route(routers, fallback, request, response, done);
    });
  };
};

var routers = function (filePath) {
  return [
    {
      matches: [ matchers.prefixMatch('/custom') ],
      go: go(filePath)
    }
  ];
};

var create = function (filePath) {
  return {
    routers: routers(filePath)
  };
};

module.exports = {
  create: create
};
