import * as usage from 'command-line-usage';

const generateUsage = function (command, desc, definitions) {
  const visibleDefinitions = definitions.filter(function (defn) {
    return defn.hidden !== true;
  });
  const commonDefs = visibleDefinitions.filter(function (defn) {
    return defn.uncommon !== true;
  });

  const uncommonDefs = visibleDefinitions.filter(function (defn) {
    return defn.uncommon === true;
  });

  const commonOptions = {
    header: 'Common Options',
    optionList: commonDefs
  };

  const uncommonOptions = {
    header: 'Uncommon Options',
    optionList: uncommonDefs
  };

  const options = [commonOptions].concat(uncommonDefs.length > 0 ? [uncommonOptions] : []);

  return usage(
    [
      {header: command, content: desc}
    ].concat(options)
  );
};

module.exports = {
  generateUsage: generateUsage
};
