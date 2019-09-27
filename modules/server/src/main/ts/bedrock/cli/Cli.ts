import * as commandLineArgs from 'command-line-args';
import { Attempt } from '../core/Attempt';
import * as Version from '../core/Version';
import * as Validation from './Validation';
import * as CliUsage from './CliUsage';
import { ExitCodes } from '../util/ExitCodes';
import { CommandLineOptions } from 'command-line-args';
import { ClOption } from './ClOptions';

export type CliError = {
  command: string;
  errors: string[];
  usage: string;
}

const parseCommandLine = (definitions: commandLineArgs.OptionDefinition[], argv: string[]): Attempt<string[], CommandLineOptions> => {
  try {
    const settings: commandLineArgs.CommandLineOptions = commandLineArgs(definitions, {argv});
    return Attempt.passed(settings);
  } catch (err) {
    return Attempt.failed([err.message !== undefined ? err.message : err]);
  }
};

export const extract = (command: string, desc: string, definitions: ClOption[], argv: string[]) => {
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
      command: command,
      errors: errs,
      usage: CliUsage.generateUsage(command, desc, definitions)
    });
  }, Attempt.passed);
};
