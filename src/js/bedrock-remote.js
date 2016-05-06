var run = function (directories) {
  var driver = require('./bedrock/auto/driver').create({
    browser: 'chrome'
  });

  var serve = require('./bedrock/server/serve');

  var cli = require('./bedrock/core/cli');
  var poll = require('./bedrock/poll/poll');

  var settings = cli.extract(directories);

  var serveSettings = {
    projectdir: settings.projectdir,
    basedir: settings.basedir,
    config: settings.config,
    testfiles: settings.testfiles,
    driver: driver
  };

  serve.start(serveSettings, function (service, done) {
    console.log('started on port: ', service.port);

    driver.get('http://localhost:' + service.port);

    poll.loop(driver, settings).then(function (result) {
      driver.sleep(1000);

      driver.quit().then(function () {
        done();
      });
        
    }, function (err) {
      driver.sleep(1000);

      driver.quit().then(function () {
        done();
        throw err;
      });
    });
  });
};


module.exports = {
  run: run
};
