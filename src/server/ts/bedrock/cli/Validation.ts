import { CommandLineOptions } from 'command-line-args';
import { Attempt } from '../core/Attempt';
import { ClOption } from './ClOptions';

const validateOne = (defn: ClOption, settings: CommandLineOptions): Attempt<string[], any[]> => {
  return defn.validate(defn.name, settings[defn.name]);
};

const validateMany = (defn: ClOption, settings: CommandLineOptions): Attempt<string[], any[]> => {
  const validations = settings[defn.name].map((f: any) => {
    return defn.validate(defn.name, f);
  });
  return Attempt.concat(validations);
};

const validateRequired = (defn: ClOption, settings: CommandLineOptions): Attempt<string[], ClOption> => {
  const output = defn.output !== undefined ? defn.output : defn.name;
  return defn.required === true && settings[output] === undefined ? Attempt.failed([
    'The *required* output property [' + output + '] from [' + defn.name + '] must be specified'
  ]) : Attempt.passed(defn);
};

export const scanRequired = (definitions: ClOption[], settings: CommandLineOptions) => {
  const requiredInfo = definitions.map((defn) => {
    return validateRequired(defn, settings);
  });
  const outcome = Attempt.concat(requiredInfo);
  return Attempt.cata<string[], ClOption[], Attempt<string[], CommandLineOptions>>(outcome, Attempt.failed, () => {
    return Attempt.passed(settings);
  });
};

const flatten = <T>(arrays: T[][]) => {
  return arrays.reduce((b: T[], a) => {
    return b.concat(a);
  }, []);
};

// Returns either a Failure of an array of error messages, or a Success of the settings object
export const scan = (definitions: ClOption[], settings: CommandLineOptions): Attempt<string[], CommandLineOptions> => {
  return definitions.reduce((rest: Attempt<string[], CommandLineOptions>, defn): Attempt<string[], CommandLineOptions> => {
    if (settings[defn.name] === undefined) return rest;
    const newValue = defn.multiple === true ? validateMany(defn, settings) : validateOne(defn, settings);
    return Attempt.carry(rest, newValue, (result, v) => {
      const output = defn.output !== undefined ? defn.output : defn.name;
      // REMOVE MUTATION when I know how to do extend in node.
      if (rest[output] !== undefined) {
        return Attempt.failed(['Incompatible']);
      }
      result[output] = defn.flatten === true ? flatten(v): v;

      return Attempt.passed(result);
    });
  }, Attempt.passed({}) as Attempt<string[], CommandLineOptions>);
};
