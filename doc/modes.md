## test mode (bedrock-auto)

*Test* mode allows the user to run tests in an automated fashion. Bedrock will spin up the browser itself (assuming the user has the right [WebDrivers](webdrivers.md) on the path),
establish a WebDriver connection with this browser and close the browser once the tests have completed.

`bedrock-auto {SUITE_NAME} {BROWSER} {CONFIG_FILE} {TESTS ...}`

BROWSER: chrome | firefox | safari | edge | ie

e.g. run tests in the project: example1

`bedrock-auto fake-suite chrome config/bolt/browser.js src/test/js/browser/OneTest.js src/test/js/browser/TwoTest.js`



## server mode (bedrock)

*Server* mode allows the user to host the tests on localhost:{port} where port is the first free port found between 8000 and 20000. It is the most commonly used
mode, and therefore is the default bedrock executable.

`bedrock config/bolt/browser.js src/test/js/browser/OneTest.js src/test/js/browser/TwoTest.js`



## remote mode (bedrock-remote)

*Remote* mode is experimental and is the same as *server* mode, except it hosts the tests on an s3 instance. In order to do this, you need to have AWS credentials
available in the `~/.aws/credentials` file. An example file might look like this:

[bedrock-aws]
aws_access_key_id = iiiiiiiiiiiiiiiii
aws_secret_access_key = aaaaaaaaaaaaaaaaaaaaa

Note, that we have named the profile here. This allows you to have multiple profiles on the same machine. In order to set this profile, you can prefix the bedrock-remote command with
an AWS_PROFILE declaration. This will be covered in the examples below.

`bedrock-remote {TEST_DIR} {UPLOAD_DIRS} {CONFIG_FILE} {TESTS ...}`

Note, UPLOAD_DIRS is a *comma-separated* list of directories relative to the current directory. Use "*" to include all directories.

e.g. run tests using the default profile in the ~/.aws/credentials file on the subdirectory remote-test-1 of the s3 bucket

`bedrock-remote remote-test-1 "src" config/bolt/browser.js src/test/js/browser/OneTest.js src/test/js.browser/TwoTest.js`

e.g. run tests using a non-default profile in the ~/.aws/credentials file

`AWS_PROFILE=bedrock-aws bedrock-remote remote-test-1 "*" config/bolt/browser.js src/test/js/browser/OneTest.js src/test/js.browser/TwoTest.js`



## saucelabs mode (bedrock-sauce)

*SauceLabs* mode is used to run the tests using the automated SauceLabs tool. You will require an account with SauceLabs that will provide you with a SauceID and a SauceKey. The *SauceLabs*
mode is designed to integrate with the jenkins test reporting system, and does not support any other tools at this stage. Note, as part of the SauceLabs step, we upload the code to an s3
bucket (which minimises latency), so you will need to set your AWS_PROFILE if it is not the default as documented in the *remote mode* section.

`bedrock-sauce {SAUCE_JOB} {SAUCE_CONFIG} {SAUCE_USER} {SAUCE_KEY} {UPLOAD_DIRS} {CONFIG_FILE} {TESTS ...}`

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

e.g. run tests on SauceLabs with the job name: saucelabspower

`bedrock-sauce saucelabspower sample/saucelabs.js not-a-real-user not-a-real-key "src,sample" config/bolt/browser.js src/test/js/browser/OneTest.js src/test/js/browser/TwoTest.js`





## saucelabs single mode (bedrock-sauce-single)

*SauceLabs Single* mode is used to run a specific platform using the automated SauceLabs tool. You will require an account with SauceLabs that will provide you with a SauceID and a SauceKey. As with the normal SauceLabs mode, we upload the code to an s3 bucket (which minimises latency), so you will need to set your AWS_PROFILE if it is not the default as documented in the *remote mode* section.

`bedrock-sauce-single {REMOTE_BASE} {SAUCE_JOB} {SAUCE_BROWSER} {SAUCE_BROWSER_VERSION} {SAUCE_OS} {SAUCE_USER} {SAUCE_KEY}`

e.g. run tests on SauceLabs on chrome latest

`bedrock-sauce-single http://where.it.was.uploaded job-name chrome latest "Windows 8.1" not-a-real-user not-a-real-key config/bolt/browser.js src/test/js/browser/OneTest.js src/test/js/browser/TwoTest.js`