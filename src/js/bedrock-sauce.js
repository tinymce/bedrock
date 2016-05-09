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
    cloption.param('sauceJob', '(String): the name of the SauceLabs job (e.g. bedrock-test)', cloption.isAny, 'SAUCE_JOB'),
    cloption.param('sauceConfig', '(Filename): the filename for the browser support matrix (JSON)', cloption.validateFile, 'SAUCE_CONFIG'),
    cloption.param('sauceUser', '(String): the SauceLabs user', cloption.isAny, 'SAUCE_USER'),
    cloption.param('sauceKey', '(String): the SauceLabs key', cloption.isAny, 'SAUCE_KEY'),
    cloption.param('testConfig', '(Filename): the filename for the config file', cloption.validateFile, 'CONFIG_FILE'),
    cloption.files('testFiles', '{Filename ...} The set of files to test', '{ TEST1 ... }')
  ], 6, 'Usage');

  var saucelabs = new SauceLabs({
    username: params.sauceUser,
    password: params.sauceKey
  });

  var settings = cli.extract(params, directories);
  console.log('settings', settings);

  var browsers = JSON.parse(fs.readFileSync(params.sauceConfig));

  var uploader = require('./bedrock/remote/uploader');
  var uploads = require('./bedrock/remote/project-uploads');
  var reporter = require('./bedrock/core/reporter');

// Use when avoiding uploading.
// var base = 'http://tbio-testing.s3-website-us-west-2.amazonaws.com/tunic/sauce';

  var targets = uploads.choose(params.sauceJob, settings);
  return uploader.upload(targets).then(function (base, uploadData) {
    var driver = require('./bedrock/remote/driver').create(params.sauceUser, params.sauceKey, {
      browser: 'chrome'
    });

    console.log('Success!');
    driver.get(base + '/index.html').then(function () {

      return driver.getSession().then(function (session) {
        saucelabs.updateJob(session.id_, { name: params.sauceJob }, function () {
          console.log('Base at', base);
          return poll.loop(driver, settings).then(reporter.write({
            name: 'platform',
            sauce: {
              id: session.id_,
              job: 'bedrock-test-sauce'
            }
          })).then(function (result) {
            console.log('Exiting: ', result);
            driver.sleep(1000);
            saucelabs.updateJob(session.id_, {
              name: params.sauceJob,
              passed: true
            }, function () {
              driver.quit();
            });

          }, function (err) {
            console.log('Error', err);
            driver.sleep(1000);
            saucelabs.updateJob(session.id_, {
              name: params.sauceJob,
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
  });
};


module.exports = {
  run: run
};
