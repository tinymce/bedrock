import { Attempt } from './bedrock/core/Attempt';
import * as Clis from './bedrock/cli/Clis';
import { BedrockSettings } from './bedrock/core/Settings';

type Program = {
  go: (settings: BedrockSettings, directories: { current: string; bin: string }) => void;
  mode: 'forAuto' | 'forManual' | 'forFramework';
}

export const run = (program: Program, directories: { current: string; bin: string }) => {
  if (Clis[program.mode] === undefined) {
    throw new Error('Bedrock mode not known: ' + program.mode);
  }

  const maybeSettings = Clis[program.mode](directories);
  Attempt.cata(maybeSettings, Clis.logAndExit, (settings: BedrockSettings) => {
    program.go(settings, directories);
  });
};
