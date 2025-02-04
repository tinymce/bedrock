import * as chalk from 'chalk';
import { Browser } from 'webdriverio';
import { TestResult } from '../server/Controller';
import { ExitCodes } from '../util/ExitCodes';
import { Attempt } from './Attempt';

type ShutdownFn = (immediate?: boolean) => Promise<any>;
type GruntDoneFn = ((success: boolean) => void) | undefined;

const exitDelay = (driver: Browser, delayExiting: boolean) => {
  // 17 minutes should be enough, if it's not we can make this configurable later.
  return delayExiting ? driver.pause(17 * 60 * 1000) : Promise.resolve();
};

// TINY-10604: Mark test runs for LambdaTest dashboard
const markLambdaTest = async (driver: Browser, status: 'failed' | 'passed') => {
  // Tests running on LambdaTests machines should have access to the `lambda_status` var.
  // Setting this var will mark the result of the test for the LT dashboard
  await driver.executeScript('if (window.lambda_status) { lambda_status=' + status + ' }', []);
};

export const exit = (gruntDone: GruntDoneFn, exitCode: number): void => {
  if (gruntDone !== undefined) {
    gruntDone(exitCode === 0);
  } else {
    process.exit(exitCode);
  }
};

export const done = async (result: Attempt<string[], TestResult[]>, driver: Browser, shutdown: ShutdownFn, gruntDone: GruntDoneFn, delayExiting: boolean): Promise<void> => {
  // Only delay exiting if tests failed.
  const exitCode = await Attempt.cata(result, async (errs) => {
    await markLambdaTest(driver, 'failed');
    await exitDelay(driver, delayExiting);
    console.log(chalk.red(errs.join('\n')));
    return ExitCodes.failures.tests;
  }, async () => {
    await markLambdaTest(driver, 'passed');
    console.log(chalk.green('All tests passed.'));
    return ExitCodes.success;
  });
  await shutdown();
  exit(gruntDone, exitCode);
};

export const error = async (err: Error | string, driver: Browser, shutdown: ShutdownFn, gruntDone: GruntDoneFn, delayExiting: boolean): Promise<void> => {
  await exitDelay(driver, delayExiting);
  console.error(chalk.red('********** Unexpected Bedrock Error -> Server Quitting **********'));
  console.error(err);
  await shutdown(true);
  exit(gruntDone, ExitCodes.failures.unexpected);
};

export const cancel = (driver: Browser, shutdown: ShutdownFn, gruntDone: GruntDoneFn): () => Promise<void> => {
  let cancelled = false;
  return async () => {
    if (cancelled) {
      return;
    }
    cancelled = true;
    console.error(chalk.red('********** Cancelling test run **********'));
    await shutdown(true);
    exit(gruntDone, ExitCodes.failures.unexpected);
  };
};
