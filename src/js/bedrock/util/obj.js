var toLowerCaseKeys = function (items) {
  var clone = {};

  Object.keys(items).forEach(function (key) {
    clone[key.toLowerCase()] = items[key];
  });

  return clone;
};

module.exports = {
  toLowerCaseKeys: toLowerCaseKeys
};
