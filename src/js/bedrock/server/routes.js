var server = require('serve-static');

var prefixMatch = function (prefix) {
  return function (url) {
    return url.indexOf(prefix) === 0;
  };
};

var routing = function (prefix, source) {
  var router = server(source);

  var go = function (request, response, done) {
    request.url = request.url.substring(prefix.length);
    router(request, response, done);
  };

  return {
    matches: prefixMatch(prefix),
    go: go
  };
};

var json = function (prefix, data) {
  var go = function (request, response/* , done */) {
    response.writeHeader(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify(data));
  };

  return {
    matches: prefixMatch(prefix),
    go: go
  };
};

var effect = function (prefix, action) {
  var go = function (request, response/* , done */) {
    var body = '';
    request.on('data', function (data) {
      body += data;
    });

    request.on('end', function () {
      var parsed = JSON.parse(body);
      action(parsed);
      response.writeHeader(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({}));
    });
  };

  return {
    matches: prefixMatch(prefix),
    go: go
  };
};

var constant = function (root, url) {
  var base = server(root);

  var go = function (request, response, done) {
    request.url = url;
    base(request, response, done);
  };

  return {
    matches: prefixMatch(root),
    go: go
  };
};

var unsupported = function (root, label) {
  var go = function (request, response/* , done */) {
    response.writeHeader(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      error: label
    }));
  };

  return {
    matches: prefixMatch(root),
    go: go
  };
};

var route = function (routes, fallback, request, response, done) {
  request.originalUrl = request.url;
  var match = routes.find(function (candidate) {
    return candidate.matches(request.url);
  });

  var matching = match === undefined ? fallback : match;
  matching.go(request, response, done);
};

module.exports = {
  routing: routing,
  effect: effect,
  constant: constant,
  unsupported: unsupported,
  json: json,
  route: route
};
