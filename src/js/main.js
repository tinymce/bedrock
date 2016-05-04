var webdriver = require('selenium-webdriver'),
  chrome = require('selenium-webdriver/chrome'),
  firefox = require('selenium-webdriver/firefox'),

  input=require('selenium-webdriver/lib/input'),

  http=require("http"),
  path=require('path'),
  url=require('url'),
  request=require('request'),



  serveStatic=require('serve-static'),
  finalhandler=require('finalhandler'),

  By = webdriver.By,
  until = webdriver.until,
  Condition = webdriver.Condition;

  var driver = new webdriver.Builder()
  .forBrowser('chrome')
  .setChromeOptions(/* ... */)
  .setFirefoxOptions(/* ... */)
  .build();

  var port = process.env.npm_config_port || 8081;
  console.log('raw', process.env.npm_config_testfiles);
  var testfiles = process.env.npm_config_testfiles.split(' ');

  console.log('json.args', process.env.npm_config_flag);
  console.log('testfiles', testfiles);

  // var args = process.argv.slice(2);
  // console.log('args', args);
  

  var routes = require('./core/bedrock-routers');
  var exits = require('./core/bedrock-exits');

  var projectRouter = routes.routing('/project', '../../tbio/petrie');
  var jsRouter = routes.routing('/js', 'src/resources');
  var libBoltRouter = routes.routing('/lib/bolt', './node_modules/@ephox/bolt/lib');
  var libJqRouter = routes.routing('/lib/jquery', './node_modules/jquery/dist');
  var cssRouter = routes.routing('/css', 'src/css');
  var testRouter = routes.json('/harness', {
    config: [ 'config/bolt/local.js' ],
    scripts: testfiles
  });
  var fallbackRouter = routes.constant('src/resources/tunic.html');

  var selRouter = routes.effect('/keys', function (data) {
    var actions = [ ];
    console.log('data', JSON.stringify(data));
    for (var i = 0; i < data.keys.length; i++) {
      var k = data.keys[i];
      if (k.text) actions.push(k.text);
      else if (k.combo) {
        var combo = k.combo;
        if (combo.ctrlKey) actions.push(input.Key.chord(input.Key.CONTROL, combo.key));
      }
    }
    console.log('actions', actions);
    var target = driver.findElement(By.css(data.selector));
    return target.sendKeys.apply(target, actions);
  });

  var server = http.createServer(function (request, response) {
    var done = finalhandler(request, response);

    routes.route(
      [ testRouter, projectRouter, libBoltRouter, libJqRouter, jsRouter, cssRouter, selRouter ],
      fallbackRouter,
      request, response, done
    );

  }).listen(port);

  driver.get('http://localhost:' + port);

 
  var oneTestTooLong = function (testName, timer, tick) {
    return function (d) {
    return new Promise(function (resolve, reject) {
      var elapsed = timer.diff(tick);
      console.log('Test: ' + testName + ' ran too long.');
      reject('Test: ' + testName + ' ran too long (' + elapsed + ')');    
    });
    };
  };

  var allTestsTooLong = function (timer, tick) {
    return function (d) {
    return new Promise(function (resolve, reject) {
      var elapsed = timer.diff(tick);
      console.log('Tests timed out: ' + elapsed + 'ms');
      reject('Tests timed out: ' + elapsed + 'ms');
    });
    };
  };

  var testsDone = function () {
    return function (d) {
    return d.wait(until.elementLocated(By.css('.test.failed')), 1).then(function (_) {
      return new Promise(function (resolve, reject) {
        reject('Some tests failed');
      });
    }, function () {
      return new Promise(function (resolve, reject) {
        resolve('');
      });         
    });        
    };
  };

  var lastTest = 0;
  var testName = '(not found)';

  var SINGLE_TEST_TIMEOUT = 3000000;
  var ALL_TEST_TIMEOUT = 60000000;
  var KEEP_GOING = false;

  var startTime = new Date().getTime();
  var overallTimer = exits.timeoutExit(ALL_TEST_TIMEOUT, startTime);
  var singleTimer = exits.timeoutExit(SINGLE_TEST_TIMEOUT, startTime);


  var nextTick = function () {
    var tick = new Date().getTime();

    // Firstly, let's check the timers to see if we should be exiting.
    if (overallTimer.hasExpired(tick)) return allTestsTooLong(overallTimer, tick);
    else if (singleTimer.hasExpired(tick)) return oneTestTooLong(testName, singleTimer, tick);
    else {
      // I want to check if there is something on the page.
      return driver.wait(until.elementLocated(By.css('div.done')), 1).then(function () {
        return testsDone();
      }, function (err) {
        return driver.wait(until.elementLocated(By.css('.progress')), 1).getInnerHtml().then(function (html) {
          var num = parseInt(html, 10);
          if (lastTest !== num) {
            singleTimer.reset(tick);
            lastTest = num;
          }

          return driver.wait(until.elementLocated(By.css('.test.running .name')), 1).getInnerHtml().then(function (html) {
            testName = html;
            return KEEP_GOING;
          }, function () {
            return KEEP_GOING;
          });
        }, function () {
          return KEEP_GOING;
        });
      });
    }
  };
  
  driver.wait(nextTick, ALL_TEST_TIMEOUT, 'ALL_TEST_TIMEOUT: ' + ALL_TEST_TIMEOUT).then(function (outcome) {
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
    var result = allTestsTooLong('3.' + overallTimer.diff(new Date().getTime()))();
    driver.quit().then(function () {
      server.close();
      throw result;
    });
    
  });
