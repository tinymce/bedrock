const attempt = require('../core/attempt');

const validateOne = function (defn, settings) {
  return defn.validate(defn.name, settings[defn.name]);
};

const validateMany = function (defn, settings) {
  const validations = settings[defn.name].map(function (f) {
    return defn.validate(defn.name, f);
  });
  return attempt.concat(validations);
};

const validateRequired = function (defn, settings) {
  const output = defn.output !== undefined ? defn.output : defn.name;
  return defn.required === true && settings[output] === undefined ? attempt.failed([
    'The *required* output property [' + output + '] from [' + defn.name + '] must be specified'
  ]) : attempt.passed(defn);
};

const scanRequired = function (definitions, settings) {
  const requiredInfo = definitions.map(function (defn) {
    return validateRequired(defn, settings);
  });
  const outcome = attempt.concat(requiredInfo);
  return attempt.cata(outcome, attempt.failed, function () {
    return attempt.passed(settings);
  });
};

const flatten = function (arrays) {
  return arrays.reduce(function (b, a) {
    return b.concat(a);
  }, []);
};

// Returns either a Failure of an array of error messages, or a Success of the settings object
const scan = function (definitions, settings) {
  return definitions.reduce(function (rest, defn) {
    if (settings[defn.name] === undefined) return rest;
    const newValue = defn.multiple === true ? validateMany(defn, settings) : validateOne(defn, settings);
    return attempt.carry(rest, newValue, function (result, v) {
      const output = defn.output !== undefined ? defn.output : defn.name;
      // REMOVE MUTATION when I know how to do extend in node.
      if (rest[output] !== undefined) {
        return attempt.failed(['Incompatible']);
      }
      result[output] = defn.flatten === true ? flatten(v): v;

      return attempt.passed(result);
    });
  }, attempt.passed({}));
};

module.exports = {
  scanRequired: scanRequired,
  scan: scan
};
