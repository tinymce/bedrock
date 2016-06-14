## test mode (bedrock-auto)

*Test* mode allows the user to run tests in an automated fashion. Bedrock will spin up the browser itself (assuming the user has the right [WebDrivers](webdrivers.md) on the path),
establish a WebDriver connection with this browser and close the browser once the tests have completed.


BROWSER: chrome | firefox | safari | MicrosoftEdge | ie | phantomjs

e.g. run automated bedrock tests in chrome against test directory src/test/js/browser

`bedrock-auto --browser chrome --testdir src/test/js/browser

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

