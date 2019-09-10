export const isString = (val: any): val is string => {
  return typeof val === 'string';
};

export const isObject = (val: any): val is object => {
  return typeof val === 'object';
};
