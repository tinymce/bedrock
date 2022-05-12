import * as chalk from 'chalk';
import * as cli from './Cli';
import * as ClOptions from './ClOptions';
import { ExitCodes } from '../util/ExitCodes';
import { Attempt } from '../core/Attempt';
import { BedrockAutoSettings, BedrockManualSettings } from '../core/Settings';

export interface Directories {
  current: string;
  bin: string;
}

// Keep this file consistent with Settings.ts

const commonOptions = (directories: Directories) => {
  return [
    ClOptions.projectdir(directories.current),
    ClOptions.basedir(directories.bin),
    ClOptions.overallTimeout,
    ClOptions.singleTimeout,
    ClOptions.customRoutes,
    ClOptions.chunk,
    ClOptions.help,
    ClOptions.logging,
    ClOptions.version,
    ClOptions.bundler,
    ClOptions.config,
    ClOptions.files,
    ClOptions.testdir,
    ClOptions.testdirs,
    ClOptions.coverage,
    ClOptions.polyfills,
    ClOptions.bucket,
    ClOptions.buckets,
    ClOptions.stopOnFailure,
    ClOptions.verbose
  ];
};

export const forAuto = (directories: Directories, argv: string[] = process.argv): Attempt<cli.CliError, BedrockAutoSettings> => {
  return cli.extract('bedrock-auto', 'Use a Webdriver to launch a browser and run tests against it', commonOptions(directories).concat([
    ClOptions.browser,
    ClOptions.name,
    ClOptions.output,
    ClOptions.debuggingPort,
    ClOptions.retries,
    ClOptions.delayExiting,
    ClOptions.useSandboxForHeadless,
    ClOptions.extraBrowserCapabilities,
    ClOptions.skipResetMousePosition,
    ClOptions.wipeBrowserCache
  ]), argv) as Attempt<cli.CliError, BedrockAutoSettings>;
};

export const forManual = (directories: Directories, argv: string[] = process.argv): Attempt<cli.CliError, BedrockManualSettings> => {
  return cli.extract('bedrock', 'Launch a testing process on a localhost port and allow the user to navigate to it in any browser',
    commonOptions(directories), argv) as Attempt<cli.CliError, BedrockManualSettings>;
};

export const logAndExit = (errs: cli.CliError): void => {
  console.error(chalk.red('\n****\nError while processing command line for ' + errs.command));
  const messages = errs.errors.join('\n');
  console.error(chalk.red(messages));
  console.error(chalk.red('Use ' + errs.command + ' --help to print usage\n****\n'));
  process.exit(ExitCodes.failures.cli);
};
