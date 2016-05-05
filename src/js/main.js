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
  .forBrowser('firefox')
  .setChromeOptions(/* ... */)
  .setFirefoxOptions(/* ... */)
  .build();

  var settings = (function () {
    var port = process.env.npm_config_port || 8081;
    console.log('raw', process.env.npm_config_testfiles);
    var testfiles = process.env.npm_config_testfiles.split(' ');
    var projectdir = process.env.npm_config_projectdir;
    console.log('projectdir', projectdir);

    console.log('testfiles', testfiles);  
    return {
      testfiles: testfiles,
      projectdir: projectdir,
      config: 'config/bolt/local.js',
      port: port
    };
  })();
  

  // var args = process.argv.slice(2);
  // console.log('args', args);
  

  var routes = require('./bedrock/route/routes');
  var timeouts = require('./bedrock/loop/timeouts');
  var exits = require('./bedrock/loop/exits');

  var routers = [
    routes.routing('/project', settings.projectdir),
    routes.routing('/js', 'src/resources'),
    routes.routing('/lib/bolt', './node_modules/@ephox/bolt/lib'),
    routes.routing('/lib/jquery', './node_modules/jquery/dist'),
    routes.routing('/css', 'src/css'),
    routes.json('/harness', {
      config: settings.config,
      scripts: settings.testfiles
    })
  ];

  var fallback = routes.constant('src/resources/tunic.html');

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
    routes.route(routers, fallback, request, response, done);
  }).listen(settings.port);

  driver.get('http://localhost:' + settings.port);

  var lastTest = 0;
  var testName = '(not found)';

  var SINGLE_TEST_TIMEOUT = 3000000;
  var ALL_TEST_TIMEOUT = 60000000;
  var KEEP_GOING = false;

  var startTime = new Date().getTime();
  var overallTimer = timeouts.timeoutExit(ALL_TEST_TIMEOUT, startTime);
  var singleTimer = timeouts.timeoutExit(SINGLE_TEST_TIMEOUT, startTime);


  var nextTick = function () {
    var tick = new Date().getTime();

    // Firstly, let's check the timers to see if we should be exiting.
    if (overallTimer.hasExpired(tick)) return exits.allTestsTooLong(overallTimer, tick);
    else if (singleTimer.hasExpired(tick)) return exits.oneTestTooLong(testName, singleTimer, tick);
    else {
      // I want to check if there is something on the page.
      return driver.wait(until.elementLocated(By.css('div.done')), 1).then(function () {
        return exits.testsDone();
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
    var result = exits.allTestsTooLong('3.' + overallTimer.diff(new Date().getTime()))();
    driver.quit().then(function () {
      server.close();
      throw result;
    });
    
  });
