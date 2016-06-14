

var go = function (settings) {
  var serve = require('./bedrock/server/pageserve');

  var poll = require('./bedrock/poll/poll');
  var reporter = require('./bedrock/core/reporter');
  var attempt = require('./bedrock/core/attempt');

  var master = require('./bedrock/server/drivermaster').create();

  var path = require('path');

  var driver = require('./bedrock/auto/driver').create({
    browser: settings.browser
  });

  var lifecycle = require('./bedrock/core/lifecycle');

  var serveSettings = {
    projectdir: settings.projectdir,
    basedir: settings.basedir,
    driver: attempt.passed(driver),
    master: master,
    page: settings.page
  };

  var pollSettings = {
    overallTimeout: 10 * 60 * 1000,
    testName: 'p#qunit-result .test-name',
    singleTimeout: null,
    done: '#qunit-banner.qunit-fail,#qunit-banner.qunit-pass',
    results: '.results'
  };

  var isPhantom = settings.browser === 'phantomjs';

  serve.start(serveSettings, function (service, done) {
    if (! isPhantom) console.log('bedrock-page available at: http://localhost:' + service.port);
    var result = driver.get('http://localhost:' + service.port + '/' + settings.page).then(function () {
      var message = isPhantom ? '\nPhantom tests loading ...\n' : '\n ... Initial page has loaded ...';
      console.log(message);
      service.markLoaded();

      var scriptFile = path.join('/page', 'src', 'resources', 'qunit-wrapper.js');
      return driver.executeScript(function (src) {
        var script = document.createElement('script');
        script.setAttribute('src', src);
        document.head.appendChild(script);
      }, scriptFile).then(function () {


      return poll.loop(master, driver, pollSettings).then(function (data) {
        return reporter.write({
          name: settings.name,
          output: settings.output
        })(data);
      });

      });
    });
    lifecycle.shutdown(result, driver, done);
  });
};

module.exports = {
  go: go,
  mode: 'forPage'
};
