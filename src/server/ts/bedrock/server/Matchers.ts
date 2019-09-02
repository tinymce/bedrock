import * as url from 'url';
import * as Cmp from '../util/Cmp';
import * as Obj from '../util/Obj';

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
  const lcHeaders = Obj.toLowerCaseKeys(headers);
  return function (request) {
    return Cmp.hasAllOf(Obj.toLowerCaseKeys(request.headers), lcHeaders);
  };
};

const queryMatch = function (query) {
  return function (request) {
    const reqQuery = url.parse(request.originalUrl, true).query;
    return Cmp.hasAllOf(reqQuery, query);
  };
};

const jsonBodyMatch = function (json) {
  return function (request) {
    const data = request.body ? JSON.parse(request.body) : { };
    return Cmp.deepEq(json, data);
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
