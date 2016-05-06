var webdriver = require('selenium-webdriver');
  var chrome = require('selenium-webdriver/chrome');
  var firefox = require('selenium-webdriver/firefox');

  var input = require('selenium-webdriver/lib/input');

  var http = require('http');
  var finalhandler = require('finalhandler');

  var openport = require('openport');

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

