import * as url from 'url';
import * as Cmp from '../util/Cmp';
import * as Obj from '../util/Obj';

export const prefixMatch = function (prefix) {
  return function (request) {
    return request.url.indexOf(prefix) === 0;
  };
};

export const methodMatch = function (method) {
  return function (request) {
    return request.method === method.toUpperCase();
  };
};

export const urlMatch = function (url) {
  return function (request) {
    return request.url === url;
  };
};

export const pathMatch = function (path) {
  return function (request) {
    return url.parse(request.originalUrl).pathname === path;
  };
};

export const headersMatch = function (headers) {
  const lcHeaders = Obj.toLowerCaseKeys(headers);
  return function (request) {
    return Cmp.hasAllOf(Obj.toLowerCaseKeys(request.headers), lcHeaders);
  };
};

export const queryMatch = function (query) {
  return function (request) {
    const reqQuery = url.parse(request.originalUrl, true).query;
    return Cmp.hasAllOf(reqQuery, query);
  };
};

export const jsonBodyMatch = function (json) {
  return function (request) {
    const data = request.body ? JSON.parse(request.body) : { };
    return Cmp.deepEq(json, data);
  };
};
