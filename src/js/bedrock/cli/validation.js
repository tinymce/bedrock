var attempt = require('../core/attempt');

var validateOne = function (defn, settings) {
  return defn.validate(defn.name, settings[defn.name]);
};

var validateMany = function (defn, settings) {
  var validations = settings[defn.name].map(function (f) {
    return defn.validate(defn.name, f);
  });
  return attempt.concat(validations);
};

var validateRequired = function (defn, settings) {
  var output = defn.output !== undefined ? defn.output : defn.name;
  return defn.required === true && settings[output] === undefined ? attempt.failed([
    'The *required* output property [' + output + '] from [' + defn.name + '] must be specified'
  ]) : attempt.passed(defn);
};

var scanRequired = function (definitions, settings) {
  var requiredInfo = definitions.map(function (defn) {
    return validateRequired(defn, settings);
  });
  var outcome = attempt.concat(requiredInfo);
  return attempt.cata(outcome, attempt.failed, function () {
    return attempt.passed(settings);
  });
};

var flatten = function (arrays) {
  return arrays.reduce(function (b, a) {
    return b.concat(a);
  }, []);
};

// Returns either a Failure of an array of error messages, or a Success of the settings object
var scan = function (definitions, settings) {
  return definitions.reduce(function (rest, defn) {
    if (settings[defn.name] === undefined) return rest;
    var newValue = defn.multiple === true ? validateMany(defn, settings) : validateOne(defn, settings);
    return attempt.carry(rest, newValue, function (result, v) {
      var output = defn.output !== undefined ? defn.output : defn.name;
      // REMOVE MUTATION when I know how to do extend in node.
      if (rest[output] !== undefined) {
        return attempt.failed([ 'Incompatible' ]);
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