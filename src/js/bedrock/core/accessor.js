var create = function (fields) {
  var r = {};

  fields.forEach(function (f) {
    r[f] = function (obj) {
      if (obj[f] === undefined) throw 'Object: does not have field: ' + f;
      return obj[f];
    };
  });

  return r;
};

module.exports = {
  create: create
};
