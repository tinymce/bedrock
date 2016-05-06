var run = function (directories) {
  var cli = require('./bedrock/core/cli');
  var poll = require('./bedrock/poll/poll');
  var SauceLabs = require('saucelabs');

  if (process.argv.length < 5) {
    console.error('CNot enough arguments, must specify user, key, configuration and at least one test file.');
    process.exit(-1);
  }
  console.log('process.argv.length', process.argv);

  var sauceUser = process.argv[2];
  console.log('user', sauceUser);
  process.argv.shift();
  var sauceKey = process.argv[2];
  process.argv.shift();
  console.log('sauceKey', sauceKey);

  var saucelabs = new SauceLabs({
    username: sauceUser,
    password: sauceKey
  });
  
  var settings = cli.extract(directories);
  console.log('settings', settings);
  
  var uploader = require('./bedrock/remote/uploader');
  var uploads = require('./bedrock/remote/project-uploads');

// Use when avoiding uploading.
// var base = 'http://tbio-testing.s3-website-us-west-2.amazonaws.com/tunic/sauce';

  var targets = uploads.choose('sauce', settings);
  return uploader.upload(targets).then(function (base, uploadData) {
    var driver = require('./bedrock/remote/driver').create(sauceUser, sauceKey, {
      browser: 'chrome'
    });

    console.log('Success!');
    console.log('driver', driver);
    driver.get(base + '/index.html');

    return poll.loop(driver, settings).then(function (result) {
      console.log('Exiting: ', result);
      driver.sleep(1000);
      driver.getSession().then(function (session) {
        saucelabs.updateJob(session.id_, {
          name: 'bedrock-test',
          passed: true
        }, function () {
          driver.quit();
        });        
      });
        
    }, function (err) {
      console.log('Error', err);
      driver.sleep(1000);
      driver.getSession().then(function (session) {
        saucelabs.updateJob(session.id_, {
          name: 'bedrock-test',
          passed: false
        }, function () {
          driver.quit().then(function () {
            throw err;
          });
        });
      });
    });
  });
};


module.exports = {
  run: run
};
