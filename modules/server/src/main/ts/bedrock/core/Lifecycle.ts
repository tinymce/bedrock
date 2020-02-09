import { BrowserObject } from 'webdriverio';
import { TestResult } from '../server/Controller';
import { ExitCodes } from '../util/ExitCodes';
import { Attempt } from './Attempt';

export const shutdown = (promise: Promise<Attempt<string[], TestResult[]>>, driver: BrowserObject, done: () => Promise<any>, gruntDone: ((success: boolean) => void) | null, delayExiting: boolean) => {
  const exitDelay = () => {
    // 17 minutes should be enough, if it's not we can make this configurable later.
    return delayExiting ? driver.pause(17 * 60 * 1000) : Promise.resolve();
  };

  const exit = (exitCode: number) => () => {
    if (gruntDone !== null) gruntDone(exitCode === 0);
    else process.exit(exitCode);
  };

  return promise.then((res) => {
    // Only check the delay exit option if tests failed.
    const delay = Attempt.cata(res, () => exitDelay(), () => Promise.resolve());

    return delay.then(() => {
      return Attempt.cata(res, (errs) => {
        console.log(errs.join('\n'));
        return done().then(exit(ExitCodes.failures.tests));
      }, () => {
        console.log('All tests passed.');
        return done().then(exit(ExitCodes.success));
      });
    });
  }).catch((err) => {
    return exitDelay().then(() => {
      console.error('********** Unexpected Bedrock Error -> Server Quitting **********');
      console.error(err);
      return done().then(exit(ExitCodes.failures.unexpected));
    });
  });
};
