import * as chalk from 'chalk';
import { Browser } from 'webdriverio';
import { TestResult } from '../server/Controller';
import { ExitCodes } from '../util/ExitCodes';
import { Attempt } from './Attempt';

export const shutdown = async (result: Attempt<string[], TestResult[]>, driver: Browser<'async'>, done: () => Promise<any>, gruntDone: ((success: boolean) => void) | null, delayExiting: boolean): Promise<void> => {
  const exitDelay = () => {
    // 17 minutes should be enough, if it's not we can make this configurable later.
    return delayExiting ? driver.pause(17 * 60 * 1000) : Promise.resolve();
  };

  const exit = (exitCode: number) => {
    if (gruntDone !== null) {
      gruntDone(exitCode === 0);
    } else {
      process.exit(exitCode);
    }
  };

  try {
    // Only check the delay exit option if tests failed.
    await Attempt.cata(result, () => exitDelay(), () => Promise.resolve());

    const exitCode = Attempt.cata(result, (errs) => {
      console.log(chalk.red(errs.join('\n')));
      return ExitCodes.failures.tests;
    }, () => {
      console.log(chalk.green('All tests passed.'));
      return ExitCodes.success;
    });
    await done();
    exit(exitCode);
  } catch (err) {
    await exitDelay();
    console.error(chalk.red('********** Unexpected Bedrock Error -> Server Quitting **********'));
    console.error(err);
    await done();
    exit(ExitCodes.failures.unexpected);
  }
};
