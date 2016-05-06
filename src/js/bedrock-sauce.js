var run = function (directories) {
  var cli = require('./bedrock/core/cli');

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
  
  var settings = cli.extract(directories);
  console.log('settings', settings);
  
  var uploader = require('./bedrock/remote/uploader');
  var uploads = require('./bedrock/remote/project-uploads');

  var targets = uploads.choose('sauce', settings);
  uploader.upload(targets).then(function (base, uploadData) {
    var driver = require('./bedrock/remote/driver').create(sauceUser, sauceKey, {
      browser: 'chrome'
    });

    console.log('Success!');
    driver.get(base + '/index.html');

    poll.loop(driver, settings).then(function (result) {
      console.log('Exiting: ', result);
      driver.sleep(1000);
      driver.quit().then(function () {
        done();
      });
        
    }, function (err) {
      console.log('Error', err);
      driver.sleep(1000);
      driver.quit().then(function () {
        throw err;
      });
    });


  }, function (err) {
    console.error('Error', err, err.stack);
  });
};


module.exports = {
  run: run
};
