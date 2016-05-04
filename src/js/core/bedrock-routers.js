(function () {
  var server = require('serve-static');
  var base = server('./');

  var routing = function (prefix, source) {
    var router = server(source);


    var matches = function (url) {
      return url.indexOf(prefix) === 0;
    };

    var go = function (request, response, done) {
      request.url = request.url.substring(prefix.length);
      router(request, response, done);
    };

    return {
      matches: matches,
      go: go
    };
  };

  var json = function (prefix, data) {
    var matches = function (url) {
      return url.indexOf(prefix) === 0;
    };

    var go = function (request, response, done) {
      response.writeHeader(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify(data));
    };

    return {
      matches: matches,
      go: go
    };
  };

  var effect = function (prefix, action) {
    var matches = function (url) {
      return url.indexOf(prefix) === 0;
    };

    var go = function (request, response, done) {
      var body = '';
      request.on('data', function (data) {
        console.log('on', data);
              body += data;

          });

          request.on('end', function () {
        // console.log('request', request);
        console.log('BODY: [' + body + ']');
        var parsed = JSON.parse(body);
        action(parsed);
        response.writeHeader(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({}));
      });
      };

    return {
      matches: matches,
      go: go
    };
  };

  var route = function (routes, fallback, request, response, done) {
    request.originalUrl = request.url;
    console.log('Looking for ', request.url);
    var match = null;
    for (var i in routes) {
      var candidate = routes[i];
      if (candidate.matches(request.url) && match === null) match = candidate;
    }

    var matching = match !== null ? match : fallback;
    matching.go(request, response, done);
  };

  var constant = function (url) {
    var matches = function () { return true; };
    var go = function (request, response, done) {
      request.url = url;
      base(request, response, done);
    };

    return {
      matches: matches,
      go: go
    };
  };

  module.exports = {
    routing: routing,
    route: route,
    effect: effect,
    constant: constant,
    json: json
  };
})();