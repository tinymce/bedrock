import { IncomingMessage } from 'http';
import * as Cmp from '../util/Cmp';
import * as Obj from '../util/Obj';

export type Matcher = (request: IncomingMessage & { originalUrl: string; body?: string }) => boolean;

export const prefixMatch = (prefix: string): Matcher => {
  return (request) => {
    return request.url !== undefined && request.url.indexOf(prefix) === 0;
  };
};

export const methodMatch = (method: string): Matcher => {
  return (request) => {
    return request.method === method.toUpperCase();
  };
};

export const urlMatch = (url: string): Matcher => {
  return (request) => {
    return request.url === url;
  };
};

export const pathMatch = (path: string): Matcher => {
  return (request) => {
    return new URL(request.originalUrl, 'http://localhost').pathname === path;
  };
};

export const headersMatch = (headers: Record<string, string>): Matcher => {
  const lcHeaders = Obj.toLowerCaseKeys(headers);
  return (request) => {
    return Cmp.hasAllOf(Obj.toLowerCaseKeys(request.headers), lcHeaders);
  };
};

export const queryMatch = (query: Record<string, string>): Matcher => {
  return (request) => {
    const reqQuery = Object.fromEntries(new URL(request.originalUrl, 'http://localhost').searchParams);
    return Cmp.hasAllOf(reqQuery, query);
  };
};

export const jsonBodyMatch = (json: any): Matcher => {
  return (request) => {
    const data = request.body ? JSON.parse(request.body) : { };
    return Cmp.deepEq(json, data);
  };
};
