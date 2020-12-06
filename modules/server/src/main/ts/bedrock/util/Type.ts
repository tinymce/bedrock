/* eslint-disable @typescript-eslint/ban-types */

const typeOf = (x: any): string => {
  if (x === null) {
    return 'null';
  }
  const t = typeof x;
  if (t === 'object' && (Array.prototype.isPrototypeOf(x) || x.constructor && x.constructor.name === 'Array')) {
    return 'array';
  }
  if (t === 'object' && (String.prototype.isPrototypeOf(x) || x.constructor && x.constructor.name === 'String')) {
    return 'string';
  }
  return t;
};

const isType = <T>(type: string) => (value: any): value is T => {
  return typeOf(value) === type;
};

export const isString = isType<string>('string');
export const isObject = isType<Object>('object');
export const isArray = isType<Array<any>>('array');
export const isNull = isType<null>('null');
export const isBoolean = isType<boolean>('boolean');
export const isUndefined = isType<undefined>('undefined');
export const isFunction = isType<Function>('function');
export const isNumber = isType<number>('number');
