// Doesn't handle all corner with undefined and null
export const deepEq = function (obj1, obj2) {
  const type = typeof obj1;
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return obj1 === obj2;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  return keys1.every(function (key) {
    return deepEq(obj1[key], obj2[key]);
  });
};

export const hasAllOf = function (obj1, obj2) {
  return Object.keys(obj2).every(function (key) {
    return obj1[key] === obj2[key];
  });
};
