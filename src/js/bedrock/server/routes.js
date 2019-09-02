const server = require('serve-static');
const matchers = require('./matchers');

const routing = function (method, prefix, source) {
  const router = server(source);

  const go = function (request, response, done) {
    request.url = request.url.substring(prefix.length);
    router(request, response, done);
  };

  return {
    matches: [matchers.methodMatch(method), matchers.prefixMatch(prefix)],
    go: go
  };
};

const json = function (method, prefix, data) {
  const go = function (request, response/* , done */) {
    concludeJson(response, 200, data);
  };

  return {
    matches: [matchers.methodMatch(method), matchers.prefixMatch(prefix)],
    go: go
  };
};

var concludeJson = function (response, status, info) {
  response.writeHeader(status, {'Content-Type': 'application/json'});
  response.end(JSON.stringify(info));
};

const asyncJs = function (method, url, fn) {
  const go = function (request, response/* , done */) {
    fn(function (data) {
      response.writeHeader(200, {'Content-Type': 'text/javascript'});
      response.end(data);
    });
  };

  return {
    matches: [matchers.methodMatch(method), matchers.urlMatch(url)],
    go: go
  };
};

const effect = function (method, prefix, action) {
  const go = function (request, response/* , done */) {
    let body = '';
    request.on('data', function (data) {
      body += data;
    });

    request.on('end', function () {
      const parsed = JSON.parse(body);
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
    matches: [matchers.methodMatch(method), matchers.prefixMatch(prefix)],
    go: go
  };
};

const rewrite = function (method, root, input, output) {
  const base = server(root);

  const go = function (request, response, done) {
    request.url = output;
    base(request, response, done);
  };

  return {
    matches: [matchers.methodMatch(method), matchers.prefixMatch(input)],
    go: go
  };
};

const constant = function (method, root, url) {
  const base = server(root);

  const go = function (request, response, done) {
    request.url = url;
    base(request, response, done);
  };

  return {
    matches: [matchers.methodMatch(method), matchers.prefixMatch(root)],
    go: go
  };
};

const host = function (method, root) {
  const base = server(root);

  const go = function (request, response, done) {
    base(request, response, done);
  };

  return {
    matches: [matchers.methodMatch(method), matchers.prefixMatch(root)],
    go: go
  };
};

const hostOn = function (method, prefix, root) {
  const base = server(root);

  const go = function (request, response, done) {
    const original = request.url;
    request.url = original.substring((prefix + '/').length);
    base(request, response, done);
  };

  return {
    matches: [matchers.methodMatch(method), matchers.prefixMatch(prefix)],
    go: go
  };
};

const unsupported = function (method, root, label) {
  const go = function (request, response/* , done */) {
    concludeJson(response, 404, {error: label});
  };

  return {
    matches: [matchers.methodMatch(method), matchers.prefixMatch(root)],
    go: go
  };
};

const route = function (routes, fallback, request, response, done) {
  request.originalUrl = request.url;

  const match = routes.find(function (candidate) {
    return candidate.matches.every(function (match) {
      return match(request);
    });
  });

  const matching = match === undefined ? fallback : match;
  matching.go(request, response, done);
};

module.exports = {
  routing: routing,
  effect: effect,
  constant: constant,
  rewrite: rewrite,
  unsupported: unsupported,
  json: json,
  asyncJs: asyncJs,
  route: route,
  host: host,
  hostOn: hostOn
};
