var run = function (directories) {
  var cli = require('./bedrock/core/cli');
  var cloption = require('./bedrock/core/cloption');
  var poll = require('./bedrock/poll/poll');
  var SauceLabs = require('saucelabs');
  var fs=require('fs');

  if (process.argv.length < 5) {
    console.error('CNot enough arguments, must specify user, key, configuration and at least one test file.');
    process.exit(-1);
  }
  console.log('process.argv.length', process.argv);

  var rest = process.argv.slice(2);
  var params = cloption.parse(rest, [
    cloption.param('sauceJob', '(String): the name of the SauceLabs job (e.g. bedrock-test)', cloption.isAny),
    cloption.param('sauceConfig', '(Filename): the filename for the browser support matrix', cloption.validateFile),
    cloption.param('sauceUser', '(String): the SauceLabs user', cloption.isAny),
    cloption.param('sauceKey', '(String): the SauceLabs key', cloption.isAny),
    cloption.param('testConfig', '(Filename): the filename for the config file', cloption.validateFile),
    cloption.files('testFiles', '{Filename ...}')
  ], 6, 'Usage');

  console.log('params', params);
  return;

  var saucelabs = new SauceLabs({
    username: params.sauceUser,
    password: params.sauceKey
  });

  console.log('rest', rest);

  var settings = cli.extract(rest, directories);
  console.log('settings', settings);

  var browsers = JSON.parse(fs.readFileSync(params.sauceConfig));

  var uploader = require('./bedrock/remote/uploader');
  var uploads = require('./bedrock/remote/project-uploads');
  var reporter = require('./bedrock/core/reporter');

// Use when avoiding uploading.
// var base = 'http://tbio-testing.s3-website-us-west-2.amazonaws.com/tunic/sauce';

  var targets = uploads.choose(sauceJob, settings);
  return uploader.upload(targets).then(function (base, uploadData) {
    var driver = require('./bedrock/remote/driver').create(sauceUser, sauceKey, {
      browser: 'chrome'
    });

    console.log('Success!');
    driver.get(base + '/index.html').then(function () {
      saucelabs.updateJob(session.id_, { name: params.sauceJob });
      console.log('Base at', base);

      return driver.getSession().then(function (session) {
        return poll.loop(driver, settings).then(reporter.write({
          name: params.project,
          sauce: {
            id: session.id_,
            job: 'bedrock-test-sauce'
          }
        })).then(function (result) {
          console.log('Exiting: ', result);
          driver.sleep(1000);
          saucelabs.updateJob(session.id_, {
            name: 'bedrock-test-sauce',
            passed: true
          }, function () {
            driver.quit();
          });

        }, function (err) {
          console.log('Error', err);
          driver.sleep(1000);
          saucelabs.updateJob(session.id_, {
            name: 'bedrock-test-sauce',
            passed: false
          }, function () {
            driver.quit().then(function () {
              throw err;
            });
          });
        });
      });
    });
  });
};


module.exports = {
  run: run
};
