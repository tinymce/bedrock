var create = function (fields) {
  var r = {};
  console.log('fields', fields);

  fields.forEach(function (f) {
    r[f] = function (obj) {
      if (obj[f] === undefined) throw 'Object: ' + JSON.stringify(obj) + ' does not have field: ' + f;
      return obj[f];
    };
  });

  return r;
};

module.exports = {
  create: create
};
