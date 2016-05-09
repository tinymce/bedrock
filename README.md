Commands
========

test mode (bedrock-auto)
---------

*Test* mode allows the user to run tests in an automated fashion. Bedrock will spin up the browser tiself (assuming the user has the right WebDrivers on the path),
establish a WebDriver connection with this browser and close the browser once the tests have completed.

`bedrock-auto {BROWSER} {CONFIG_FILE} {TESTS ...}`

BROWSER: chrome | firefox | safari | edge | ie

e.g. run tests in the project: example1

`bedrock-auto chrome config/bolt/browser.js src/test/js/browser/OneTest.js src/test/js/browser/TwoTest.js`



server mode (bedrock)
---------

*Server* mode allows the user to host the tests on localhost:{port} where port is the first free port found between 8000 and 20000. It is the most commonly used
mode, and therefore is the default bedrock executable.

`bedrock config/bolt/browser.js src/test/js/browser/OneTest.js src/test/js/browser/TwoTest.js`



remote mode (bedrock-remote)
-----------

*Remote* mode is experimental and is the same as *server* mode, except it hosts the tests on an s3 instance. In order to do this, you need to have AWS credentials
available in the `~/.aws/credentials` file. An example file might look like this:

[bedrock-aws]
aws_access_key_id = iiiiiiiiiiiiiiiii
aws_secret_access_key = aaaaaaaaaaaaaaaaaaaaa

Note, that we have named the profile here. This allows you to have multiple profiles on the same machine. In order to set this profile, you can prefix the bedrock-remote command with
an AWS_PROFILE declaration. This will be covered in the examples below.

`bedrock-remote {TEST_NAME} {CONFIG_FILE} {TESTS ...}`

e.g. run tests using the default profile in the ~/.aws/credentials file

`bedrock-remote remote-test-1 config/bolt/browser.js src/test/js/browser/OneTest.js src/test/js.browser/TwoTest.js`

e.g. run tests using a non-default profile in the ~/.aws/credentials file

`AWS_PROFILE=bedrock-aws bedrock-remote remote-test-1 config/bolt/browser.js src/test/js/browser/OneTest.js src/test/js.browser/TwoTest.js`



saucelabs mode (bedrock-sauce)
-----------

*SauceLabs* mode is used to run the tests using the automated SauceLabs tool. You will require an account with SauceLabs that will provide you with a SauceID and a SauceKey. The *SauceLabs*
mode is designed to integrate with the jenkins CI SauceLabs plugin, and does not support any other CI tools at this stage. Note, as part of the SauceLabs step, we upload the code to an s3
bucket (which minimises latency), so you will need to profile your AWS_PROFILE if it is not the default as documented in the *remote mode* section.

`bedrock-sauce {SAUCELABS_JOB_NAME} {SAUCE_ID} {SAUCE_KEY} {CONFIG_FILE} {TESTS ...}`

e.g. run tests on SauceLabs with the job name: saucelabspower

`bedrock-sauce saucelabspower not-a-real-id not-a-real-key config/bolt/browser.js src/test/js/browser/OneTest.js src/test/js/browser/TwoTest.js`




WebDriver Support (2.47.0*)
==========

Firefox
--------

Browser: firefox

Installation:

* Works out of the box.

Chrome
-------

Browser: chrome

Installation:

* Install ChromeDriver onto your path. The link from (https://www.npmjs.com/package/selenium-webdriver) worked.

Safari
------

Browser: safari

Installation:

* Install a WebDriver as a Safari extension. This is an involved process:


1. Download Safari Driver jar (2.43.1) from maven link: (http://central.maven.org/maven2/org/seleniumhq/selenium/selenium-safari-driver/2.43.1/selenium-safari-driver-2.43.1.jar)
2. Unzip it (treat the jar as a zip)
3. Navigate to org/openqa/selenium
4. Double click "SafariDriver.safariextz"

Internet Explorer
-------------

Browser: ie

Installation:

1. Download http://selenium-release.storage.googleapis.com/2.53/IEDriverServer_x64_2.53.1.zip
2. Put the file IEDriverServer.exe onto your path

Edge (2.53.0)
-----

Browser: MicrosoftEdge

Installation:

1. Install the Edge Driver installer from https://www.npmjs.com/package/selenium-webdriver
2. Put in on your path (it's probably in "Program Files x86")

Note, I didn't actually get this working. It failed.


*: Selenium WebDriver 2.47.0 is the highest supported version of SauceLabs.

