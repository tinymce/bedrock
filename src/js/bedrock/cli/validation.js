var attempt = require('../core/attempt.js');

var validateOne = function (defn, settings) {
  return defn.validate(defn.name, settings[defn.name]);
};

var validateMany = function (defn, settings) {
  return settings[defn.name].map(function (f) {
    return defn.validate(defn.name, f);
  });
};

var checkIncompatible = function (defn, settings) {
  if (settings[defn.name] === undefined) return attempt.passed(defn);
  var incompatible = defn.incompatible !== undefined ? defn.incompatible : [];
  var conflicting = incompatible.filter(function (n) {
    return settings[n] !== undefined;
  });
  return conflicting.length > 0 ? attempt.failed({
    property: defn.name,
    value: settings[def.name],
    error: 'custom',
    label: 'Property [' + defn.name + '] cannot be used in conjunction with: ' + JSON.stringify(conflicting)
  }) : attempt.passed(defn);
};

var checkRequired = function (defn, settings) {
  var output = defn.output !== undefined ? defn.output : defn.name;
  return defn.required === true && settings[output] === undefined ? attempt.failed({
    property: defn.name,
    value: settings[defn.name],
    error: 'custom',
    label: 'The output property [' + defn.output + '] from [' + defn.name + '] must be specified.'
  }) : attempt.passed(defn);
};

// Returns either a Failure of an array of error messages, or a Success of the settings object
var scan = function (definitions, settings) {
  return definitions.reduce(function (rest, defn) {
    if (settings[defn.name] === undefined) return rest;
    var newValue = defn.multiple === true ? validateMany(defn, settings) : validateOne(defn, settings);

    return attempt.cata(rest, function (errors) {
      return attempt.cata(newValue, function (validateErrors) {
        return attempt.failed(errors.concat(validateErrors));
      }, function (_) {
        return attempt.failed(errors);
      });
    }, function (result) {
      return attempt.cata(newValue, function (validateErrors) {
        return attempt.failed(validateErrors);
      }, function (v) {
        var output = defn.output !== undefined ? defn.output : defn.name;
        // REMOVE MUTATION.
        result[output] = v;

        return attempt.passed(result);
      });
    });
  }, attempt.passed({}));
};

module.exports = {
  checkIncompatible: checkIncompatible,
  scan: scan
};