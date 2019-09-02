export const create = function (fields) {
  const r = {};

  fields.forEach(function (f) {
    r[f] = function (obj) {
      if (obj[f] === undefined) {
        throw new Error('Object: does not have field: ' + f);
      }
      return obj[f];
    };
  });

  return r;
};
