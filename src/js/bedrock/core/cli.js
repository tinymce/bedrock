var cloptions = require('./cloptions.js');
var commandLineArgs = require('command-line-args');
var usage = require('command-line-usage');

var validateOne = function (defn, settings) {
  return defn.validate(defn.name, settings[defn.name]);
};

var validateMany = function (defn, settings) {
  return settings[defn.name].map(function (f) {
    return defn.validate(defn.name, f);
  });
};

var extract = function (command, desc, directories, extraDefinitions) {
  var baseDefinitions = [
    cloptions.config,
    cloptions.files,
    cloptions.testdir,

    cloptions.doneSelector,
    cloptions.projectdir(directories),
    cloptions.basedir(directories),
    cloptions.overallTimeout,
    cloptions.singleTimeout,
    cloptions.progressSelector,
    cloptions.totalSelector,
    cloptions.testNameSelector,
    cloptions.resultsSelector
  ];

  var filteredDefinitions = baseDefinitions.filter(function (defn) {
    return !extraDefinitions.find(function (ed) {
      return ed.name === defn.name;
    });
  });

  var definitions = filteredDefinitions.concat(extraDefinitions);
  var settings = commandLineArgs(definitions);
  try {
    definitions.forEach(function (defn) {
      if (settings[defn.name] !== undefined) {
        var incompatible = defn.incompatible !== undefined ? defn.incompatible : [];
        incompatible.forEach(function (n) {
          if (settings[n] !== undefined) throw 'Setting: ' + defn.name + ' is incompatible with: ' + n;
        });
      }
    });

    var result = {};
    definitions.forEach(function (defn) {
      if (settings[defn.name] !== undefined) {
        var newValue = defn.multiple === true ? validateMany(defn, settings) : validateOne(defn, settings);
        var output = defn.output !== undefined ? defn.output : defn.name;
        result[output] = newValue;
      }
    });

    definitions.forEach(function (defn) {
      var output = defn.output !== undefined ? defn.output : defn.name;
      console.log('output', output);
      if (defn.required === true && result[output] === undefined) throw 'Setting: ' + defn.name + ' must be specified.';
    });


    console.log('result', result);
    return result;
  } catch (err) {
    console.error('\n** Error processing command line arguments.\n');
    console.error(err);

    var commonDefs = definitions.filter(function (defn) {
      return defn.uncommon !== true;
    });

    var uncommonDefs = definitions.filter(function (defn) {
      return defn.uncommon === true;
    });

    var commonOptions = {
      header: 'Common Options',
      optionList: commonDefs
    };

    var uncommonOptions = {
      header: 'Uncommon Options',
      optionList: uncommonDefs
    };

    var options = [ commonOptions ].concat(uncommonDefs.length > 0 ? [ uncommonOptions ] : []);

    console.error(usage(
      [
        { header: command, content: desc }
      ].concat(options)
    ));

    process.exit(0);
  }
};

module.exports = {
  extract: extract
};
