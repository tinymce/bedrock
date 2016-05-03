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
    

	// driver.get('demo/index.html');
	// driver.findElement(By.name('q')).sendKeys('webdriver');
	// driver.findElement(By.name('btnG')).click();
	driver.wait(function () {
		var tick = new Date().getTime();
		var elapsed = tick - allStartTime;
		if (elapsed > 3000) return allTestsTooLong(elapsed);
		else return undefined;
	}, 4000).then(function (outcome) {
		outcome(driver);
	});
	driver.quit();
