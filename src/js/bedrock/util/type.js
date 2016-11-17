var isString = function (val) {
  return typeof val === 'string';
};

var isObject = function (val) {
  return typeof val === 'object';
};

module.exports = {
  isString: isString,
  isObject: isObject
};
