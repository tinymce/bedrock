# SauceLabs Integration

> NOTE: `bedrock` has only experimental support for SauceLabs integrations. This feature is not yet reliable.

There are three commands which handle the integration: `bedrock-remote`, `bedrock-sauce-single`, and `bedrock-sauce`.


## bedrock-remote

`bedrock-remote` is used to send the testing files to an amazon s3 bucket. The user can then navigate their browser to the uploaded URL and 'run(view)' the tests manually, or run the tests on SauceLabs using `bedrock-sauce-single`. In order to upload to an s3 bucket, you will need to provide the credentials to authorise your upload.

The easiest way of providing aws credentials is by creating a file in `~/.aws/credentials` that contains the `access-key` and the `secret-access-key`, and associates it with a profile. For example:

```
[bedrock-aws]
aws_access_key_id = iiiiiiiiiiiiiiiii
aws_secret_access_key = aaaaaaaaaaaaaaaaaaaaa
```

Now, you can precede your `bedrock-remote` call with `AWS_PROFILE=bedrock-aws` and you will be able to access your amazon s3 bucket.

`bedrock-remote` requires a `bucket` and a `bucketfolder` that your credentials have access to. If you do not provide the appropriate bucket information, you will get an access error.


### Example

Upload some bedrock sample tests to an s3 bucket for remote testing:

1. Name of the s3 bucket: e.g. test-bucket
2. Name of the s3 bucket folder: e.g. test-folder
3. Upload directories: e.g. sample
4. Files to test: sample/AsyncPassTest.js sample/AsyncFailTest.js
5. Config file: sample/config.js
6. Name of the AWS profile: bedrock-aws

`AWS_PROFILE=bedrock-aws bedrock-remote --bucketfolder test-folder --bucket test-bucket --uploaddirs sample --files sample/AsyncPassTest.js sample/AsyncFailTest.js --config sample/config.js `

This will upload all of the files in `sample` to the specified bucket location as well as the bedrock test runner. If you navigate to the URL that it logs, you can execute the tests on your own browser. Alterantively, you can use `bedrock-sauce-single` to run against it using SauceLabs.

Use `bedrock-remote --help` to see all arguments possible.





## bedrock-sauce-single

`bedrock-sauce-single` is used to leverage SauceLabs to run an uploaded test runner on a single platform. It is primarily provided as a means of getting fast feedback on a previously uploaded test runner.

Note, in order to use [SauceLabs](https://saucelabs.com), you will need an account with SauceLabs that will provide you with a `SauceID` and `SauceKey`. You will also need to provide the platform to run the test on, though it will default to Chrome latest on Linux.

### Example

Run tests against a previously uploaded test runner

1. URL of the test runner previously uploaded. The previous example would have given us something similar to: [http://test-bucket.s3-website-us-west-2.amazonaws.com/test-folder]
2. SauceID: not-a-real-id
3. SauceKey: not-a-real-key
4. Browser: firefox
5. Browser version: latest
6. OS: Windows 10

`bedrock-sauce-single --remoteurl http://test-bucket.s3-website-us-west-2.amazonaws.com/test-folder --sauceuser not-a-real-user --saucekey not-a-real-key --saucebrowser firefox --sauceos "Windows 10" --saucebrowserVersion "latest"`

Use `bedrock-sauce-single --help` to see all arguments possible.



## bedrock-sauce

`bedrock-sauce` is a combination of `bedrock-sauce-single` and `bedrock-remote`. It will upload the tests and test runner, and run a matrix of platforms against that test runner using SauceLabs. As with `bedrock-sauce-single`, you will need to have a SauceLabs account with a `SauceID` and `SauceKey`.

The matrix of platforms is specified by a single JSON file. It is an array of objects where each object has `browser`, `os`, and an optional `browser-version`.

Supported browsers: "MicrosoftEdge", "internet explorer", "firefox", "chrome", "safari"

Supported OS: "Windows 10", "Windows 8.1", "OS X 10.9", "Linux"

Sample JSON file:

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


### Example

Run sample tests in bedrock using SauceLabs against a platform matrix

1. Name of the s3 bucket: e.g. test-bucket
2. Name of the s3 bucket folder: e.g. test-folder
3. Upload directories: e.g. sample
4. Files to test: sample/AsyncPassTest.js sample/AsyncFailTest.js
5. Config file: sample/config.js
6. Name of the AWS profile: bedrock-aws
7. SauceLabs configuration matrix: sample/saucelabs.js
8. SauceID: not-a-real-id
9. SauceKey: not-a-real-key

`AWS_PROFILE=bedrock-aws bedrock-sauce --bucketfolder test-folder --bucket test-bucket --uploaddirs sample --files sample/AsyncPassTest.js  --config sample/config.js  --sauceconfig sample/saucelabs.js --sauceuser not-a-real-user --saucekey not-a-real-key

Use `bedrock-sauce --help` to see all arguments possible.


