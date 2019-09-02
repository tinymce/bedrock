const toLowerCaseKeys = function (items) {
  const clone = {};

  Object.keys(items).forEach(function (key) {
    clone[key.toLowerCase()] = items[key];
  });

  return clone;
};

module.exports = {
  toLowerCaseKeys: toLowerCaseKeys
};
