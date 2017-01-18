var SauceLabs = require('saucelabs');

var create = function (settings) {
  var saucelabs = new SauceLabs({
    username: settings.sauceuser,
    password: settings.saucekey
  });

  var reporter = require('../core/reporter');
  var attempt = require('../core/attempt');

  var setJobPassed = function (session, name) {
    return function (result) {
      return new Promise(function (resolve, reject) {
        saucelabs.updateJob(session.id_, {
          name: name,
          passed: true
        }, function () {
          resolve(result);
        });
      });
    };
  };

  var setJobFailed = function (session, name) {
    return function (err) {
      /* eslint no-unused-vars: "off"*/
      return new Promise(function (resolve, reject) {
        saucelabs.updateJob(session.id_, {
          name: name,
          passed: false
        }, function () {
          reject(err);
        });
      });
    };
  };

  var runTest = function (suiteName, driver, f) {
    return driver.getSession().then(function (session) {
      var name = settings.name;

      var setAsPassed = setJobPassed(session, name);
      var setAsFailed = setJobFailed(session, name);

      var checkResults = function (maybeResult) {
        return attempt.cata(maybeResult, function (errs) {
          var error = errs.join('\n');
          return setAsFailed(error);
        }, function (result) {
          return setAsPassed(result);
        });
      };

      var logResults = reporter.write({
        name: suiteName,
        output: settings.output,
        sauce: {
          id: session.id_,
          job: name
        }
      });

      // The reporter passes for successful and failed tests, so inspect the outcome.
      return f().then(logResults, function (pollExit) {
        return reporter.writePollExit({
          name: suiteName,
          output: settings.output,
          sauce: {
            id: session.id_,
            job: name
          }
        }, pollExit);
      }).then(checkResults, setAsFailed);
    });
  };

  return {
    runTest: runTest
  };
};

module.exports = {
  create: create
};
