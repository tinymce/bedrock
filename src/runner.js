var webdriver = require('selenium-webdriver'),
    chrome = require('selenium-webdriver/chrome'),
    firefox = require('selenium-webdriver/firefox'),

    By = webdriver.By,
    until = webdriver.until,
    Condition = webdriver.Condition;

    var driver = new webdriver.Builder()
    .forBrowser('chrome')
    .setChromeOptions(/* ... */)
    .setFirefoxOptions(/* ... */)
    .build();

    driver.get('http://localhost/me/stash-morgan/bedrock/demo/index.html');

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

    var SINGLE_TEST_TIMEOUT = 4000;
    var ALL_TEST_TIMEOUT = 30000;
    var KEEP_GOING = undefined;


    var nextTick = function () {
        var tick = new Date().getTime();
        var elapsed = tick - allStartTime;
        var testElapsed = tick - testStartTime;
        console.log('testElapsed: ' + testElapsed);

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
    driver.wait(nextTick, 1000).then(function (outcome) {
        outcome(driver);
    }, function () {
        allTestsTooLong(new Date().getTime() - allStartTime)();
    });
    driver.quit();
