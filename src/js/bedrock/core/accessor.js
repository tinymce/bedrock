var create = function (fields) {
  var r = {};
  console.log('fields', fields);

  fields.forEach(function (f) {
    console.log('f', f);
    r[f] = function (obj) {
      console.log('here');
      return obj[f];
    };
  });

  return r;
};

module.exports = {
  create: create
};
