var server = require('serve-static');
var matchers = require('./matchers');

var routing = function (method, prefix, source) {
  var router = server(source);

  var go = function (request, response, done) {
    request.url = request.url.substring(prefix.length);
    router(request, response, done);
  };

  return {
    matches: [ matchers.methodMatch(method), matchers.prefixMatch(prefix) ],
    go: go
  };
};

var json = function (method, prefix, data) {
  var go = function (request, response/* , done */) {
    concludeJson(response, 200, data);
  };

  return {
    matches: [ matchers.methodMatch(method), matchers.prefixMatch(prefix) ],
    go: go
  };
};

var concludeJson = function (response, status, info) {
  response.writeHeader(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(info));
};

var effect = function (method, prefix, action) {
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
    matches: [ matchers.methodMatch(method), matchers.prefixMatch(prefix) ],
    go: go
  };
};

var rewrite = function (method, root, input, output) {
  var base = server(root);

  var go = function (request, response, done) {
    request.url = output;
    base(request, response, done);
  };

  return {
    matches: [ matchers.methodMatch(method), matchers.prefixMatch(input) ],
    go: go
  };
};

var constant = function (method, root, url) {
  var base = server(root);

  var go = function (request, response, done) {
    request.url = url;
    base(request, response, done);
  };

  return {
    matches: [ matchers.methodMatch(method), matchers.prefixMatch(root) ],
    go: go
  };
};

var host = function (method, root) {
  var base = server(root);

  var go = function (request, response, done) {
    base(request, response, done);
  };

  return {
    matches: [ matchers.methodMatch(method), matchers.prefixMatch(root) ],
    go: go
  };
};

var hostOn = function (method, prefix, root) {
  var base = server(root);

  var go = function (request, response, done) {
    var original = request.url;
    request.url = original.substring((prefix + '/').length);
    base(request, response, done);
  };

  return {
    matches: [ matchers.methodMatch(method), matchers.prefixMatch(prefix) ],
    go: go
  };
};

var unsupported = function (method, root, label) {
  var go = function (request, response/* , done */) {
    concludeJson(response, 404, { error: label });
  };

  return {
    matches: [ matchers.methodMatch(method), matchers.prefixMatch(root) ],
    go: go
  };
};

var route = function (routes, fallback, request, response, done) {
  request.originalUrl = request.url;

  var match = routes.find(function (candidate) {
    return candidate.matches.every(function (match) {
      return match(request);
    });
  });

  var matching = match === undefined ? fallback : match;
  matching.go(request, response, done);
};

module.exports = {
  routing: routing,
  effect: effect,
  constant: constant,
  rewrite: rewrite,
  unsupported: unsupported,
  json: json,
  route: route,
  host: host,
  hostOn: hostOn
};
