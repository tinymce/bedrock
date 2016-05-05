var run = function (directories) {
  var webdriver = require('selenium-webdriver');
  var chrome = require('selenium-webdriver/chrome');
  var firefox = require('selenium-webdriver/firefox');

  var input = require('selenium-webdriver/lib/input');

  var http = require('http');
  var finalhandler = require('finalhandler');

  var By = webdriver.By;
  var until = webdriver.until;
  var Condition = webdriver.Condition;
 
  var cli = require('./bedrock/cli/cli');
  var settings = cli.extract(directories);

  var driver = new webdriver.Builder()
    .forBrowser('firefox')
    .setChromeOptions(/* ... */)
    .setFirefoxOptions(/* ... */)
    .build();


  var KEEP_GOING = false;

  var routes = require('./bedrock/route/routes');  
  var exits = require('./bedrock/loop/exits');
  var keys = require('./bedrock/effects/keys');
  var state = require('./bedrock/loop/state');

  var routers = [
    routes.routing('/project', settings.projectdir),
    routes.routing('/js', settings.basedir + 'src/resources'),
    routes.routing('/lib/bolt', settings.basedir + 'node_modules/@ephox/bolt/lib'),
    routes.routing('/lib/jquery', settings.basedir + 'node_modules/jquery/dist'),
    routes.routing('/css', settings.basedir + 'src/css'),
    routes.json('/harness', {
      config: settings.config,
      scripts: settings.testfiles
    }),
    routes.effect('/keys', keys.executor(driver))
  ];

  var fallback = routes.constant(settings.basedir, 'src/resources/tunic.html');

  var server = http.createServer(function (request, response) {
    var done = finalhandler(request, response);
    routes.route(routers, fallback, request, response, done);
  }).listen(settings.port);

  driver.get('http://localhost:' + settings.port);

  var currentState = state.init({
    overallTimeout: settings.overallTimeout,
    singleTimeout: settings.singleTimeout,
    testName: settings.testName,
    // done: settings.done,
    progress: settings.progress,
    total: settings.total
  });

  var nextTick = function () {
    var tick = new Date().getTime();

    if (currentState.allTimeout(tick)) return exits.allTestsTooLong(currentState, tick);
    else if (currentState.testTimeout(tick)) return exits.oneTestTooLong(currentState, tick);
    else {
      // I want to check if there is something on the page.
      return driver.wait(until.elementLocated(By.css(settings.done)), 1).then(function () {
        return exits.testsDone(settings);
      }, function (err) {
        // We aren't done yet ... so update the current test if necessary.
        return currentState.update(driver, tick).then(function () {
          return KEEP_GOING;
        }, function () {
          return KEEP_GOING;
        });
      });
    }
  };
  
  driver.wait(nextTick, settings.overallTimeout + 100000).then(function (outcome) {
    outcome(driver).then(function (result) {
      driver.sleep(1000);

      driver.quit().then(function () {
        server.close();
      });
      
    }, function (err) {
      driver.sleep(1000);

      driver.quit().then(function () {
        server.close();
        throw err;
      });
    });        
  }, function (err) {
    console.log('err', err);
    var result = exits.allTestsTooLong(currentState, new Date().getTime())();
    driver.quit().then(function () {
      server.close();
      throw result;
    });
    
  });
};

module.exports = {
  run: run
};
