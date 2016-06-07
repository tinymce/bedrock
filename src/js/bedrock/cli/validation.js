var attempt = require('../core/attempt.js');

var validateOne = function (defn, settings) {
  return defn.validate(defn.name, settings[defn.name]);
};

var validateMany = function (defn, settings) {
  return settings[defn.name].map(function (f) {
    return defn.validate(defn.name, f);
  });
};

var validateRequired = function (defn, settings) {
  var output = defn.output !== undefined ? defn.output : defn.name;
  return defn.required === true && settings[output] === undefined ? attempt.failed([
    'The *required* output property [' + defn.output + '] from [' + defn.name + '] must be specified.'
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

// Returns either a Failure of an array of error messages, or a Success of the settings object
var scan = function (definitions, settings) {
  return definitions.reduce(function (rest, defn) {
    if (settings[defn.name] === undefined) return rest;
    var newValue = defn.multiple === true ? validateMany(defn, settings) : validateOne(defn, settings);

    return attempt.carry(rest, newValue, function (v) {
      var output = defn.output !== undefined ? defn.output : defn.name;
      // REMOVE MUTATION when I know how to do extend in node.
      if (rest[output] !== undefined) {
        return attempt.failed('Incompatible');
      }
      rest[output] = v;

      return attempt.passed(rest);
    });
  }, attempt.passed({}));
};

module.exports = {
  scanRequired: scanRequired,
  scan: scan
};