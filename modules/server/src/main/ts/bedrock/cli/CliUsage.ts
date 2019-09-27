import * as usage from 'command-line-usage';
import { ClOption } from './ClOptions';

export const generateUsage = (command: string, desc: string, definitions: ClOption[]): string => {
  const visibleDefinitions = definitions.filter((defn) => {
    return defn.hidden !== true;
  });
  const commonDefs = visibleDefinitions.filter((defn) => {
    return defn.uncommon !== true;
  });

  const uncommonDefs = visibleDefinitions.filter((defn) => {
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

  const options: any[] = [commonOptions].concat(uncommonDefs.length > 0 ? [uncommonOptions] : []);

  return usage(
    [
      {header: command, content: desc}
    ].concat(options)
  );
};
