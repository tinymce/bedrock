export const typeOf = function (x: any) {
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
