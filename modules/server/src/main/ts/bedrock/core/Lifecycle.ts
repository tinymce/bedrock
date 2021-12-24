import * as chalk from 'chalk';
import { Browser } from 'webdriverio';
import { TestResult } from '../server/Controller';
import { ExitCodes } from '../util/ExitCodes';
import { Attempt } from './Attempt';

type ShutdownFn = () => Promise<any>;
type GruntDoneFn = ((success: boolean) => void) | undefined;

const exitDelay = (driver: Browser<'async'>, delayExiting: boolean) => {
  // 17 minutes should be enough, if it's not we can make this configurable later.
  return delayExiting ? driver.pause(17 * 60 * 1000) : Promise.resolve();
};

export const exit = (gruntDone: GruntDoneFn, exitCode: number): void => {
  if (gruntDone !== undefined) {
    gruntDone(exitCode === 0);
  } else {
    process.exit(exitCode);
  }
};

export const done = async (result: Attempt<string[], TestResult[]>, driver: Browser<'async'>, shutdown: ShutdownFn, gruntDone: GruntDoneFn, delayExiting: boolean): Promise<void> => {
  // Only delay exiting if tests failed.
  const exitCode = await Attempt.cata(result, async (errs) => {
    await exitDelay(driver, delayExiting);
    console.log(chalk.red(errs.join('\n')));
    return ExitCodes.failures.tests;
  }, async () => {
    console.log(chalk.green('All tests passed.'));
    return ExitCodes.success;
  });
  await shutdown();
  exit(gruntDone, exitCode);
};

export const error = async (err: Error | string, driver: Browser<'async'>, shutdown: ShutdownFn, gruntDone: GruntDoneFn, delayExiting: boolean): Promise<void> => {
  await exitDelay(driver, delayExiting);
  console.error(chalk.red('********** Unexpected Bedrock Error -> Server Quitting **********'));
  console.error(err);
  await shutdown();
  exit(gruntDone, ExitCodes.failures.unexpected);
};
