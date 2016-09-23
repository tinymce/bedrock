var cmp = require('../util/cmp');
var obj = require('../util/obj');
var url = require('url');

var prefixMatch = function (prefix) {
  return function (request) {
    return request.url.indexOf(prefix) === 0;
  };
};

var methodMatch = function (method) {
  return function (request) {
    return request.method === method.toUpperCase();
  };
};

var urlMatch = function (url) {
  return function (request) {
    return request.url === url;
  };
};

var pathMatch = function (path) {
  return function (request) {
    return url.parse(request.originalUrl).pathname === path;
  };
};

var headersMatch = function (headers) {
  var lcHeaders = obj.toLowerCaseKeys(headers);
  return function (request) {
    return cmp.hasAllOf(obj.toLowerCaseKeys(request.headers), lcHeaders);
  };
};

var queryMatch = function (query) {
  return function (request) {
    var reqQuery = url.parse(request.originalUrl, true).query;
    return cmp.hasAllOf(reqQuery, query);
  };
};

var jsonBodyMatch = function (json) {
  return function (request) {
    var data = request.body ? JSON.parse(request.body) : { };
    return cmp.deepEq(json, data);
  };
};

module.exports = {
  prefixMatch: prefixMatch,
  methodMatch: methodMatch,
  pathMatch: pathMatch,
  urlMatch: urlMatch,
  headersMatch: headersMatch,
  queryMatch: queryMatch,
  jsonBodyMatch: jsonBodyMatch
};
