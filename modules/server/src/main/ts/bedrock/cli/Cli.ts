import { Attempt } from '../core/Attempt.js';
import * as Version from '../core/Version.js';
import * as Validation from './Validation.js';
import * as CliUsage from './CliUsage.js';
import { ExitCodes } from '../util/ExitCodes.js';
import commandLineArgs from 'command-line-args';
import { CommandLineOptions, OptionDefinition } from 'command-line-args';
import { ClOption } from './ClOptions.js';

export type CliError = {
  command: string;
  errors: string[];
  usage: string;
}

const parseCommandLine = (definitions: OptionDefinition[], argv: string[]): Attempt<string[], CommandLineOptions> => {
  try {
    const settings: CommandLineOptions = commandLineArgs(definitions, {argv});
    return Attempt.passed(settings);
  } catch (err) {
    return Attempt.failed([err.message !== undefined ? err.message : err]);
  }
};

export const extract = (command: string, desc: string, definitions: ClOption[], argv: string[]): Attempt<CliError, CommandLineOptions> => {
  const parsed = parseCommandLine(definitions, argv);

  Attempt.cata(parsed, () => {
    // TODO: this should report an error
  }, (s) => {
    if (s.help === true) {
      // Print usage information if used with --help or -h.
      console.log(CliUsage.generateUsage(command, desc, definitions));
      process.exit(ExitCodes.success);
    } else if (s.version === true) {
      console.log(command + ' version: ' + Version.get());
      process.exit(ExitCodes.success);
    }
  });

  const extracted = Attempt.list(parsed, [
    (settings) => Validation.scan(definitions, settings),
    (results) => Validation.scanRequired(definitions, results)
  ]);

  return Attempt.cata<string[], CommandLineOptions, Attempt<CliError, CommandLineOptions>>(extracted, (errs) => {
    return Attempt.failed({
      command,
      errors: errs,
      usage: CliUsage.generateUsage(command, desc, definitions)
    });
  }, Attempt.passed);
};
