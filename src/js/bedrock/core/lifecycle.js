var exitcodes = require('../util/exitcodes');

var shutdown = function (promise, driver, done, gruntDone, delayExiting) {
  var attempt = require('./attempt');

  var exitDelay = delayExiting !== true ? 1000 : 1000000;

  promise.then(function (res) {
    // All good, so continue.
    driver.sleep(exitDelay);

    driver.quit().then(function () {
      done();
      attempt.cata(res, function (errs) {
        console.log(errs.join('\n'));
        if (gruntDone !== null) gruntDone(false);
        else process.exit(exitcodes.failures.tests);
      }, function () {
        console.log('All tests passed.');
        if (gruntDone !== null) gruntDone(true);
      });
    });
  }, function (err) {
    driver.sleep(exitDelay);
    driver.quit().then(function () {
      console.error('********** Unexpected Bedrock Error -> Server Quitting **********', err);
      done();
      if (gruntDone !== null) gruntDone(false);
      else process.exit(exitcodes.failures.tests);
    });
  });
};

module.exports = {
  shutdown: shutdown
};
