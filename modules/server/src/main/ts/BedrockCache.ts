// pre-compile the things here
import * as path from 'path';
import * as Compiler from './bedrock/compiler/Compiler';
import { BedrockAutoSettings } from './bedrock/core/Settings';
import * as SettingsResolver from './bedrock/core/SettingsResolver';

export const mode = 'precompile';

export const go = async (bedrockAutoSettings: BedrockAutoSettings): Promise<void> => {
  const settings = SettingsResolver.resolveAndLog(bedrockAutoSettings);
  const projectDir = settings.projectdir;
  const cacheDir = settings.cache ?? 'bedrock';
  await Compiler.compile({
    bundler: settings.bundler,
    tsConfigFile: path.join(projectDir, settings.config),
    scratchDir: path.join(projectDir, 'scratch', cacheDir),
    basedir: settings.basedir,
    exitOnCompileError: true,
    files: settings.testfiles,
    coverage: settings.coverage,
    polyfills: settings.polyfills
  }).generate();
};