import * as Attempt from '../core/Attempt';

const validateOne = function (defn, settings) {
  return defn.validate(defn.name, settings[defn.name]);
};

const validateMany = function (defn, settings) {
  const validations = settings[defn.name].map(function (f) {
    return defn.validate(defn.name, f);
  });
  return Attempt.concat(validations);
};

const validateRequired = function (defn, settings) {
  const output = defn.output !== undefined ? defn.output : defn.name;
  return defn.required === true && settings[output] === undefined ? Attempt.failed([
    'The *required* output property [' + output + '] from [' + defn.name + '] must be specified'
  ]) : Attempt.passed(defn);
};

const scanRequired = function (definitions, settings) {
  const requiredInfo = definitions.map(function (defn) {
    return validateRequired(defn, settings);
  });
  const outcome = Attempt.concat(requiredInfo);
  return Attempt.cata(outcome, Attempt.failed, function () {
    return Attempt.passed(settings);
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
    return Attempt.carry(rest, newValue, function (result, v) {
      const output = defn.output !== undefined ? defn.output : defn.name;
      // REMOVE MUTATION when I know how to do extend in node.
      if (rest[output] !== undefined) {
        return Attempt.failed(['Incompatible']);
      }
      result[output] = defn.flatten === true ? flatten(v): v;

      return Attempt.passed(result);
    });
  }, Attempt.passed({}));
};

module.exports = {
  scanRequired: scanRequired,
  scan: scan
};
