`bedrock` is a test runner for JavaScript projects. Its primary use is to test `bolt` `(@ephox/bolt)` projects, but it also has a `qunit` wrapper. It can run in both manual mode (where the user navigates to the browser themselves), or automatic mode (where `bedrock` starts the browser and runs the tests automatically). Note, automatic mode requires webdrivers to be installed and available on the path.

# Installing bedrock

Bedrock is available as an `npm` package. You can install it via `npm install @ephox/bedrock`.

Additionally, you can install it from the source with `npm install .` in the source directory.


# Using bedrock

`bedrock` has

## test mode (bedrock-auto)

*Test* mode allows the user to run tests in an automated fashion. Bedrock will spin up the browser itself (assuming the user has the right [WebDrivers](webdrivers.md) on the path),
establish a WebDriver connection with this browser and close the browser once the tests have completed.


BROWSER: chrome | firefox | safari | MicrosoftEdge | ie | phantomjs

e.g. run automated bedrock tests in chrome against test directory src/test/js/browser

`bedrock-auto --browser chrome --testdir src/test/js/browser`

Use `bedrock-auto --help` to see all arguments possible.

## server mode (bedrock)

*Server* mode allows the user to host the tests on localhost:{port} where port is the first free port found between 8000 and 20000. It is the most commonly used
mode, and therefore is the default bedrock executable.

`bedrock --files src/test/js/browser/TwoTest.js`

Use `bedrock --help` to see all arguments possible.


## remote mode (bedrock-remote)

*Remote* mode is experimental and is the same as *server* mode, except it hosts the tests on an s3 instance. In order to do this, you need to have AWS credentials
available in the `~/.aws/credentials` file. An example file might look like this:

[bedrock-aws]
aws_access_key_id = iiiiiiiiiiiiiiiii
aws_secret_access_key = aaaaaaaaaaaaaaaaaaaaa

Note, that we have named the profile here. This allows you to have multiple profiles on the same machine. In order to set this profile, you can prefix the bedrock-remote command with
an AWS_PROFILE declaration. This will be covered in the examples below.

e.g. run tests using the default profile

`bedrock-remote --uploaddirs src test config --testdir test


e.g. run tests using a non-default profile in the ~/.aws/credentials file

`AWS_PROFILE=bedrock-aws bedrock-remote --uploaddirs src test config --testdir test`

Use `bedrock-remote --help` to see all arguments possible.


## saucelabs mode (bedrock-sauce)

*SauceLabs* mode is used to run the tests using the automated SauceLabs tool. You will require an account with SauceLabs that will provide you with a SauceID and a SauceKey. The *SauceLabs*
mode is designed to integrate with the jenkins test reporting system, and does not support any other tools at this stage. Note, as part of the SauceLabs step, we upload the code to an s3
bucket (which minimises latency), so you will need to set your AWS_PROFILE if it is not the default as documented in the *remote mode* section.

`bedrock-sauce --uploaddirs src --testdir src/test --sauceconfig {SAUCE_CONFIG} --sauceuser aaa --saucekey bbb`

Note, {SAUCE_CONFIG} is a json file which specifies the platform configuration. These will be farmed off to SauceLabs in parallel. An example saucelabs configuration file:

`sample/saucelabs.js`
```
[
  {
    "browser": "MicrosoftEdge",
    "os": "Windows 10"
  },
  {
    "browser": "internet explorer",
    "browser-version": "11",
    "os": "Windows 8.1"
  },
  {
    "browser": "firefox",
    "os": "Windows 8.1"
  },
  {
    "browser": "firefox",
    "os": "OS X 10.9"
  },
  {
    "browser": "chrome",
    "os": "Windows 8.1"
  },
  {
    "browser": "chrome",
    "os": "OS X 10.9"
  }
]
```
Use `bedrock-sauce --help` to see all arguments possible.



## saucelabs single mode (bedrock-sauce-single)

*SauceLabs Single* mode is used to run a specific platform using the automated SauceLabs tool. You will require an account with SauceLabs that will provide you with a SauceID and a SauceKey. As with the normal SauceLabs mode, we upload the code to an s3 bucket (which minimises latency), so you will need to set your AWS_PROFILE if it is not the default as documented in the *remote mode* section.

`bedrock-sauce-single --remoteurl {REMOTE_BASE} --sauceuser aaa --saucekey bbb`

Use `bedrock-sauce-single --help` to see all arguments possible.

## framework mode

*Framework* mode allows bedrock to run using an existing framework. The only currently supported testing framework is `qunit`. Bedrock assumes that a single page is responsible for running all the tests, so a `page` and `browser` are the only things required. Another parameter `framework` is also possible, but its only possible value currently is `qunit`.

e.g. Run existing tests on a qunit page using phantom

`bedrock-framework --page tests/index.html --browser phantomjs`

Use `bedrock-framework --help` to see all arguments possible.



## WebDriver Support (2.47.0*)

### Firefox

Browser: firefox

Installation:

* Works out of the box.

### Chrome

Browser: chrome

Installation:

* Install ChromeDriver onto your path. The link from (https://www.npmjs.com/package/selenium-webdriver) worked.

### Safari

Browser: safari

Installation:

* Install a WebDriver as a Safari extension. This is an involved process:


1. Download Safari Driver jar (2.43.1) from maven link: (http://central.maven.org/maven2/org/seleniumhq/selenium/selenium-safari-driver/2.43.1/selenium-safari-driver-2.43.1.jar)
2. Unzip it (treat the jar as a zip)
3. Navigate to org/openqa/selenium
4. Double click "SafariDriver.safariextz"

### Internet Explorer

Browser: ie

Installation:

1. Download http://selenium-release.storage.googleapis.com/2.53/IEDriverServer_x64_2.53.1.zip
2. Put the file IEDriverServer.exe onto your path

> Note, the 64bit version of the IEDriver can be painfully slow and break often. If you are experiencing problems, use
the 32bit version.

### Edge (2.53.0)

Browser: MicrosoftEdge

Installation:

1. Install the Edge Driver installer from https://www.npmjs.com/package/selenium-webdriver
2. Put in on your path (it's probably in "Program Files x86")

Note, I didn't actually get this working. It failed.


*: Selenium WebDriver 2.47.0 is the highest supported version of SauceLabs.

1. [command modes](doc/modes.md)
2. [webdriver setup](doc/webdrivers.md)





4. Running Tests

`$ npm run test`

For just normal tape tests:

`$ npm run test-atomic`

For property-based tests:

`$ npm run test-props`
