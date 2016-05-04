var webdriver = require('selenium-webdriver'),
    chrome = require('selenium-webdriver/chrome'),
    firefox = require('selenium-webdriver/firefox'),

    http=require("http"),
    path=require('path'),
    url=require('url'),

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

    var projectRouter = routes.routing('/project', '../../tbio/petrie');
    var jsRouter = routes.routing('/js', '../../../../../ephox/etools/tunic/1.5.0.95/www/js');
    var cssRouter = routes.routing('/css', '../../../../../ephox/etools/tunic/1.5.0.95/www/css');
    var testRouter = routes.json('/harness', {
        config: [ 'config/bolt/local.js' ],
        scripts: args
    });

    var server = http.createServer(function (request, response) {
        var done = finalhandler(request, response);

        routes.route([ testRouter, projectRouter, jsRouter, cssRouter ], request, response, done);

    }).listen(8080);

    driver.get('http://localhost:8080/');

    var allStartTime = new Date().getTime();
    var testStartTime = new Date().getTime();

    var oneTestTooLong = function (testName, elapsed) {
      return function (d) {
        console.log('Test: ' + testName + ' ran too long.');
      };
    };

    var allTestsTooLong = function (elapsed) {
      return function (d) {
        var readable = elapsed / 1000;
        console.log('Tests timed out: ' + elapsed + 'ms');
      };
    };

    var testsDone = function () {
      return function (d) {
        console.log('tests done');
      };
    };

    var lastTest = 0;

    var SINGLE_TEST_TIMEOUT = 10000;
    var ALL_TEST_TIMEOUT = 6000000;
    var KEEP_GOING = false;


    var nextTick = function () {
        var tick = new Date().getTime();
        var elapsed = tick - allStartTime;
        var testElapsed = tick - testStartTime;

        // I want to check if there is something on the page.
        return driver.wait(until.elementLocated(By.css('div.done')), 1).then(function () {
            return testsDone();
        }, function (err) {
            return driver.wait(until.elementLocated(By.css('.progress')), 1).then(function (elem) {
                return elem.getInnerHtml().then(function (html) {
                    var num = parseInt(html, 10);
                    if (lastTest !== num) {
                        testStartTime = tick;
                        lastTest = num;
                        return (elapsed > ALL_TEST_TIMEOUT) ? allTestsTooLong(elapsed) : KEEP_GOING;
                    } else {
                        return (testElapsed > SINGLE_TEST_TIMEOUT) ? oneTestTooLong('test', elapsed) : KEEP_GOING;
                    }
                });
            }, function () {
                if (elapsed > ALL_TEST_TIMEOUT) return allTestsTooLong(elapsed);
                else if (testElapsed > SINGLE_TEST_TIMEOUT) return oneTestTooLong('test', elapsed);
                else return KEEP_GOING;
            });
        });
    };
    

    // driver.get('demo/index.html');
    // driver.findElement(By.name('q')).sendKeys('webdriver');
    // driver.findElement(By.name('btnG')).click();
    driver.wait(nextTick, ALL_TEST_TIMEOUT).then(function (outcome) {
        outcome(driver);
    }, function () {
        allTestsTooLong(new Date().getTime() - allStartTime)();
    });

    // driver.quit().then(function () {
    //     server.close();
    // });

