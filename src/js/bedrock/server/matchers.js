const cmp = require('../util/cmp');
const obj = require('../util/obj');
const url = require('url');

const prefixMatch = function (prefix) {
  return function (request) {
    return request.url.indexOf(prefix) === 0;
  };
};

const methodMatch = function (method) {
  return function (request) {
    return request.method === method.toUpperCase();
  };
};

const urlMatch = function (url) {
  return function (request) {
    return request.url === url;
  };
};

const pathMatch = function (path) {
  return function (request) {
    return url.parse(request.originalUrl).pathname === path;
  };
};

const headersMatch = function (headers) {
  const lcHeaders = obj.toLowerCaseKeys(headers);
  return function (request) {
    return cmp.hasAllOf(obj.toLowerCaseKeys(request.headers), lcHeaders);
  };
};

const queryMatch = function (query) {
  return function (request) {
    const reqQuery = url.parse(request.originalUrl, true).query;
    return cmp.hasAllOf(reqQuery, query);
  };
};

const jsonBodyMatch = function (json) {
  return function (request) {
    const data = request.body ? JSON.parse(request.body) : { };
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
