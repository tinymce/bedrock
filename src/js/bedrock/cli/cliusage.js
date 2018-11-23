var usage = require('command-line-usage');

var generateUsage = function (command, desc, definitions) {
  var visibleDefinitions = definitions.filter(function (defn) {
    return defn.hidden !== true;
  })
  var commonDefs = visibleDefinitions.filter(function (defn) {
    return defn.uncommon !== true;
  });

  var uncommonDefs = visibleDefinitions.filter(function (defn) {
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

  return usage(
    [
      { header: command, content: desc }
    ].concat(options)
  );
};

module.exports = {
  generateUsage: generateUsage
};