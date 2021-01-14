import { CliError } from './bedrock/cli/Cli';
import { Attempt } from './bedrock/core/Attempt';
import * as Clis from './bedrock/cli/Clis';
import { BedrockSettings } from './bedrock/core/Settings';

type Program = {
  go: <T extends BedrockSettings>(settings: T, directories: { current: string; bin: string }) => void;
  mode: 'forAuto' | 'forManual';
}

export const run = (program: Program, directories: { current: string; bin: string }): void => {
  if (Clis[program.mode] === undefined) {
    throw new Error('Bedrock mode not known: ' + program.mode);
  }

  const maybeSettings: Attempt<CliError, BedrockSettings> = Clis[program.mode](directories);
  Attempt.cata(maybeSettings, Clis.logAndExit, (settings) => {
    program.go(settings, directories);
  });
};
