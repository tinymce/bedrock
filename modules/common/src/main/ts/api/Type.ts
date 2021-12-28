export const typeOf = (x: any): string => {
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
// eslint-disable-next-line @typescript-eslint/ban-types
export const isObject = isType<Object>('object');
