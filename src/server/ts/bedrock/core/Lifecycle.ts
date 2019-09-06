import { ExitCodes } from '../util/ExitCodes';
import { Attempt } from './Attempt';

export const shutdown = function (promise, driver, done, gruntDone, delayExiting) {
  const exitDelay = function () {
    if (delayExiting) {
      // 17 minutes should be enough, if it's not we can make this configurable later.
      driver.sleep(17 * 60 * 1000);
    }
  };

  promise.then(function (res) {
    // Only check the delay exit option if tests failed.
    Attempt.cata(res, function (_errs) {
      exitDelay();
    }, function () {
      // TODO: maybe an Attempt.isFailure would work better here
    });

    // we always need at least 1s delay here
    driver.sleep(1000);

    driver.quit().then(function () {
      done();
      Attempt.cata(res, function (errs) {
        console.log(errs.join('\n'));
        if (gruntDone !== null) gruntDone(false);
        else process.exit(ExitCodes.failures.tests);
      }, function () {
        console.log('All tests passed.');
        if (gruntDone !== null) gruntDone(true);
        else process.exit(0); // I don't know why it won't exit without this.
      });
    });
  }, function (err) {
    exitDelay();
    // we always need at least 1s delay here
    driver.sleep(1000);

    driver.quit().then(function () {
      console.error('********** Unexpected Bedrock Error -> Server Quitting **********');
      console.error(err);
      done();
      if (gruntDone !== null) gruntDone(false);
      else process.exit(ExitCodes.failures.tests);
    });
  });
};
