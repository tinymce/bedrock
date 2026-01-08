import { CliError } from './bedrock/cli/Cli.js';
import { Attempt } from './bedrock/core/Attempt.js';
import * as Clis from './bedrock/cli/Clis.js';
import { BedrockSettings } from './bedrock/core/Settings.js';

// set NodeJS console logging of objects to be actually useful
import * as Util from 'util';
Util.inspect.defaultOptions.depth = null;

type Program = {
  go: <T extends BedrockSettings>(settings: T, directories: { current: string; bin: string }) => Promise<void>;
  mode: 'forAuto' | 'forManual';
}

export const run = async (program: Program, directories: { current: string; bin: string }): Promise<void> => {
  if (Clis[program.mode] === undefined) {
    throw new Error('Bedrock mode not known: ' + program.mode);
  }

  const maybeSettings: Attempt<CliError, BedrockSettings> = Clis[program.mode](directories);
  await Attempt.cata(maybeSettings, Clis.logAndExit, async (settings) => {
    await program.go(settings, directories);
  });
};
