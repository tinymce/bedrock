var webdriver = require('selenium-webdriver'),
    chrome = require('selenium-webdriver/chrome'),
    firefox = require('selenium-webdriver/firefox'),

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

    var args = process.argv.slice(2);
    console.log('args', args);
    

    var routes = require('./bedrock-routers');
    var exits = require('./bedrock-exits');

    var projectRouter = routes.routing('/project', '../../tbio/petrie');
    var jsRouter = routes.routing('/js', '../../../../../ephox/etools/tunic/1.5.0.95/www/js');
    var cssRouter = routes.routing('/css', '../../../../../ephox/etools/tunic/1.5.0.95/www/css');
    var testRouter = routes.json('/harness', {
        config: [ 'config/bolt/local.js' ],
        scripts: args
    });

    var selRouter = routes.effect('/keys', function (data) {
        driver.findElement(By.css(data.selector)).sendKeys(data.keys);
    });

    var server = http.createServer(function (request, response) {
        var done = finalhandler(request, response);

        routes.route([ testRouter, projectRouter, jsRouter, cssRouter, selRouter ], request, response, done);

    }).listen(8080);

    driver.get('http://localhost:8080/');

 
    var oneTestTooLong = function (testName, elapsed) {
      return function (d) {
        console.log('Test: ' + testName + ' ran too long.');
        return new Error('Test: ' + testName + ' ran too long.');
      };
    };

    var allTestsTooLong = function (elapsed) {
      return function (d) {
        console.log('Start: ' + new Date(startTime));
        console.log('Finish: ' + new Date());
        console.log('startTime', startTime, 'elapsed', elapsed);
        var readable = elapsed / 1000;
        console.log('Tests timed out: ' + elapsed + 'ms');
        return new Error('Tests timed out: ' + elapsed + 'ms');
      };
    };

    var testsDone = function () {
      return function (d) {
        console.log('tests done');
      };
    };

    var lastTest = 0;

    var SINGLE_TEST_TIMEOUT = 30000;
    var ALL_TEST_TIMEOUT = 600000;
    var KEEP_GOING = false;

    var startTime = new Date().getTime();
    var overallTimer = exits.timeoutExit(ALL_TEST_TIMEOUT, startTime);
    var singleTimer = exits.timeoutExit(SINGLE_TEST_TIMEOUT, startTime);


    var nextTick = function () {
        var tick = new Date().getTime();

        // I want to check if there is something on the page.
        return driver.wait(until.elementLocated(By.css('div.done')), 1).then(function () {
            return testsDone();
        }, function (err) {
            return driver.wait(until.elementLocated(By.css('.progress')), 1).getInnerHtml().then(function (html) {
                var num = parseInt(html, 10);
                if (lastTest !== num) {
                    singleTimer.reset(tick);
                    lastTest = num;
                    return overallTimer.hasExpired(tick) ? allTestsTooLong('1.' + overallTimer.diff(tick)) : KEEP_GOING;
                } else {
                    return singleTimer.hasExpired(tick) ? oneTestTooLong('test', singleTimer.diff(tick)) : KEEP_GOING;
                }
            }, function () {
                if (overallTimer.hasExpired(tick)) return allTestsTooLong('2.' + overallTimer.diff(tick));
                else if (singleTimer.hasExpired(tick)) return oneTestTooLong('{test-name}', singleTimer.diff(tick));
                else return KEEP_GOING;
            });
        });
    };
    
    driver.wait(nextTick, ALL_TEST_TIMEOUT, 'ALL_TEST_TIMEOUT: ' + ALL_TEST_TIMEOUT).then(function (outcome) {
        var result = outcome(driver);

        driver.sleep(1000);

        driver.quit().then(function () {
            server.close();
            if (result instanceof Error) throw result;
        });
        
    }, function (err) {
        console.log('err', err);
        var result = allTestsTooLong('3.' + overallTimer.diff(new Date().getTime()))();
        driver.quit().then(function () {
            server.close();
            throw result;
        });
        
    });
