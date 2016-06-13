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
    concludeJson(response, 200, data);
  };

  return {
    matches: prefixMatch(prefix),
    go: go
  };
};

var concludeJson = function (response, status, info) {
  response.writeHeader(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(info));
};

var effect = function (prefix, action) {
  var go = function (request, response/* , done */) {
    var body = '';
    request.on('data', function (data) {
      body += data;
    });

    request.on('end', function () {
      var parsed = JSON.parse(body);
      action(parsed).then(function () {
        concludeJson(response, 200, {});
      }, function (err) {
        console.error('Executing effect failed: \n** ' + body);
        console.error('Error: ', err);
        concludeJson(response, 500, {});
      });
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

var host = function (root) {
  var base = server(root);

  var go = function (request, response, done) {
    base(request, response, done);
  };

  return {
    matches: prefixMatch(root),
    go: go
  };
};

var unsupported = function (root, label) {
  var go = function (request, response/* , done */) {
    concludeJson(response, 404, { error: label });
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
  route: route,
  host: host
};
