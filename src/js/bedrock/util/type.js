const isString = function (val) {
  return typeof val === 'string';
};

const isObject = function (val) {
  return typeof val === 'object';
};

module.exports = {
  isString: isString,
  isObject: isObject
};
