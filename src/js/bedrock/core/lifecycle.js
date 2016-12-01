var exitcodes = require('../util/exitcodes');

var shutdown = function (promise, driver, done) {
  var attempt = require('./attempt');

  promise.then(function (res) {
    // All good, so continue.
    driver.sleep(1000);

    driver.quit().then(function () {
      done();
      attempt.cata(res, function (errs) {
        console.log(errs.join('\n'));
        process.exit(exitcodes.failures.tests);
      }, function () {
        console.log('All tests passed.');
      });
    });
  }, function (err) {
    driver.sleep(1000);
    driver.quit().then(function () {
      console.error('********** Unexpected Bedrock Error -> Server Quitting **********', err);
      done();
      process.exit(exitcodes.failures.tests);
    });
  });
};

module.exports = {
  shutdown: shutdown
};