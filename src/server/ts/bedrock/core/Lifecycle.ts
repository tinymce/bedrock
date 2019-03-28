import { ExitCodes } from '../util/ExitCodes';
import { Attempt } from './Attempt';

export const shutdown = function (promise: Promise<Attempt<string[], any>>, driver, done, gruntDone, delayExiting) {
  const exitDelay = function () {
    // 17 minutes should be enough, if it's not we can make this configurable later.
    return delayExiting ? driver.pause(17 * 60 * 1000) : Promise.resolve();
  };

  const exit = function (exitCode) {
    return function () {
      if (gruntDone !== null) gruntDone(exitCode === 0);
      else process.exit(exitCode);
    };
  };

  return promise.then(function (res) {
    // Only check the delay exit option if tests failed.
    const delay = Attempt.cata(res, function (_errs) {
      return exitDelay();
    }, function () {
      return Promise.resolve();
    });

    return delay.then(function () {
      return Attempt.cata(res, function (errs) {
        console.log(errs.join('\n'));
        return done().then(exit(ExitCodes.failures.tests));
      }, function () {
        console.log('All tests passed.');
        return done().then(exit(ExitCodes.success));
      });
    });
  }).catch(function (err) {
    return exitDelay().then(function () {
      console.error('********** Unexpected Bedrock Error -> Server Quitting **********');
      console.error(err);
      return done().then(exit(ExitCodes.failures.unexpected));
    });
  });
};
