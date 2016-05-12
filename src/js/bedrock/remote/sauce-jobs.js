var create = function (params) {
  var poll = require('./bedrock/poll/poll');
  var saucelabs = require('saucelabs')({
    username: params.sauceUser,
    password: params.sauceKey
  });

  var reporter = require('./bedrock/core/reporter');

  var setJobPassed = function (session, name) {
    return function (result) {
      return new Promise(function (resolve, reject) {
        saucelabs.updateJob(session.id_, {
          name: name,
          result: passed
        }, function () {
          resolve(reult);
        });
      });
    };
  };

  var setJobFailed = function (session, name) {
    return function (err) {
      return new Promise(function (resolve, reject) {
        saucelabs.updateJob(session.id_, {
          name: name,
          result: false
        }, function () {
          resolve(err);
        });
      });
    };
  };

  var setName = function (session, name) {
    return new Promise(function (resolve, reject) {
      saucelabs.updateJob(session.id_, {
        name: name
      }, function () {
        resolve(name);
      });
    });
  };

  var runTest = function (suiteName, driver, f) {
    var name = params.sauceJob;
    var setAsPassed = setJobPassed(session, name);
    var setAsFailed = setJobFailed(session, name);

    var logResults = reporter.write({
      name: suiteName,
      output: params.outputDir,
      sauce: {
        id: session.id_,
        job: params.sauceJob
      }
    });

    return driver.getSession().then(function (session) {
      return setName(session, name).then(f).then(logResults).then(setAsPassed, setAsFailed);
    });
  };

  return {
    runTest: runTest
  };
};


module.exports = {
  create: create
};
