import * as cli from './Cli';
import * as ClOptions from './ClOptions';
import { ExitCodes } from '../util/ExitCodes';
import { Attempt } from '../core/Attempt';
import { BedrockAutoSettings, BedrockFrameworkSettings, BedrockSettings } from '../core/Settings';

export interface Directories {
  current: string;
  bin: string;
}

const commonOptions = (directories: Directories) => {
  return [
    ClOptions.projectdir(directories.current),
    ClOptions.basedir(directories.bin),
    ClOptions.overallTimeout,
    ClOptions.singleTimeout,
    ClOptions.chunk,
    ClOptions.help,
    ClOptions.logging,
    ClOptions.version,
    ClOptions.bundler
  ];
};

export const forAuto = (directories: Directories, argv: string[] = process.argv) => {
  return cli.extract('bedrock-auto', 'Use a Webdriver to launch a browser and run tests against it', commonOptions(directories).concat([
    ClOptions.browser,
    ClOptions.config,
    ClOptions.files,
    ClOptions.testdir,
    ClOptions.testdirs,
    ClOptions.name,
    ClOptions.output,
    ClOptions.debuggingPort,
    ClOptions.customRoutes,
    ClOptions.stopOnFailure,
    ClOptions.retries,
    ClOptions.delayExiting,
    ClOptions.useSandboxForHeadless,
    ClOptions.skipResetMousePosition,
    ClOptions.coverage,
    ClOptions.wipeBrowserCache
  ]), argv) as Attempt<cli.CliError, BedrockAutoSettings>;
};

export const forManual = (directories: Directories, argv: string[] = process.argv) => {
  return cli.extract('bedrock', 'Launch a testing process on a localhost port and allow the user to navigate to it in any browser', commonOptions(directories).concat([
    ClOptions.stopOnFailure__hidden,
    ClOptions.config,
    ClOptions.files,
    ClOptions.testdir,
    ClOptions.testdirs,
    ClOptions.customRoutes,
    ClOptions.coverage
  ]), argv) as Attempt<cli.CliError, BedrockSettings>;
};

export const forFramework = (directories: Directories, argv: string[] = process.argv) => {
  return cli.extract('bedrock-framework', 'Load bedrock against a specific page using a framework', commonOptions(directories).concat([
    ClOptions.stopOnFailure,
    ClOptions.name,
    ClOptions.page,
    ClOptions.browser,
    ClOptions.output,
    ClOptions.framework,
    ClOptions.debuggingPort
  ]), argv) as Attempt<cli.CliError, BedrockFrameworkSettings>;
};

export const logAndExit = (errs: cli.CliError) => {
  console.error('\n****\nError while processing command line for ' + errs.command);
  const messages = errs.errors.join('\n');
  console.error(messages);
  console.error('Use ' + errs.command + ' --help to print usage\n****\n');
  process.exit(ExitCodes.failures.cli);
};
