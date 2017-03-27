
var master = require('../../src/js/bedrock/server/drivermaster').create();
var driver = require('../../src/js/bedrock/auto/driver');
var lifecycle = require('../../src/js/bedrock/core/lifecycle');
var routes = require('../../src/js/bedrock/server/routes');
var scrape = require('../../src/js/bedrock/poll/scrape');
var attempt = require('../../src/js/bedrock/core/attempt');

var basedir = process.cwd();


var assertEq = function (label, expected, actual) {
  return expected === actual ? attempt.passed({}) : attempt.failed(
    [ 'Test ' + label + ' failed. Expected: ' + expected + ', was: ' + actual ]
  );
};

driver.create({
  browser: 'phantomjs',
  basedir: basedir
}).then(function (driver) {

  var http = require('http');
  var finalhandler = require('finalhandler');

  var openport = require('openport');

  openport.find({
    startingPort: 8000,
    endingPort: 20000
  }, function (err, port) {
    if (err) {
      console.log('Error looking for open port between 8000 and 20000: ' + err);
      return;
    }

    var routers = [
      routes.constant('GET', basedir, 'test/resources/html/screen.html')
    ];

    var server = http.createServer(function (request, response) {
      var done = finalhandler(request, response);
      routes.route(routers, routers[0], request, response, done);
    }).listen(port);

    var result = driver.get('http://localhost:' + port).then(function () {
      return scrape.scrape(driver, {
        testName: '.acceptance-test-name',
        progress: '.acceptance-test-progress'
      }).then(function (dataAttempt) {
        return attempt.cata(
          dataAttempt,
          function (err) {
            return Promise.reject(err);
          },
          function (data) {
            return Promise.resolve(
              attempt.bind(
                assertEq('testName', 'NameOfTest', data.testName),
                function () {
                  return assertEq('progress', 12, data.progress);
                }
              )
            );
          }
        );
      });
    });

    lifecycle.shutdown(result, driver, function () {
      server.close();
    }, null);
  });
});