var fs = require('fs');
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

var goFromResponse = function (matchResponse) {
  return function (request, response/* , done */) {
    var headers = matchResponse.headers ? obj.toLowerCaseKeys(matchResponse.headers) : { };
    var status = matchResponse.status ? matchResponse.status : 200;

    if (matchResponse.json && !('content-type' in headers)) {
      headers['content-type'] = 'application/json';
    }

    response.writeHead(status, headers);

    if (matchResponse.json) {
      response.end(JSON.stringify(matchResponse.json, null, '  '));
    }
  };
};

var jsonToRouters = function (data) {
  return data.map(function (staticRouter) {
    return {
      matches: matchesFromRequest(staticRouter.request),
      go: goFromResponse(staticRouter.response)
    };
  });
};

var fallbackGo = function (request, response, done) {
  response.writeHead(404, {'content-type': 'application/json'});
  response.end('Could not find a matching custom route for: ' + request.method + ' ' + request.url + ' ' + request.body);
  done();
};

var go = function (filePath) {
  var fallback = { matching: [], go: fallbackGo };
  return function (request, response, done) {
    var routers = filePath ? jsonToRouters(parseJson(filePath)) : [ ];
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
