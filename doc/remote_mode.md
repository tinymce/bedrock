# bedrock-remote

`bedrock-remote` is used to send the testing files to an amazon s3 bucket. The user can then navigate their browser to the uploaded URL and 'run(view)' the tests manually. In order to upload to an s3 bucket, you will need to provide the credentials to authorise your upload.

The easiest way of providing aws credentials is by creating a file in `~/.aws/credentials` that contains the `access-key` and the `secret-access-key`, and associates it with a profile. For example:

```
[bedrock-aws]
aws_access_key_id = iiiiiiiiiiiiiiiii
aws_secret_access_key = aaaaaaaaaaaaaaaaaaaaa
```

Now, you can precede your `bedrock-remote` call with `AWS_PROFILE=bedrock-aws` and you will be able to access your amazon s3 bucket.

`bedrock-remote` requires a `bucket` and a `bucketfolder` that your credentials have access to. If you do not provide the appropriate bucket information, you will get an access error.


## Example

Upload some bedrock sample tests to an s3 bucket for remote testing:

1. Name of the s3 bucket: e.g. test-bucket
2. Name of the s3 bucket folder: e.g. test-folder
3. Upload directories: e.g. sample
4. Files to test: sample/AsyncPassTest.js sample/AsyncFailTest.js
5. Config file: sample/config.js
6. Name of the AWS profile: bedrock-aws

`AWS_PROFILE=bedrock-aws bedrock-remote --bucketfolder test-folder --bucket test-bucket --uploaddirs sample --files sample/AsyncPassTest.js sample/AsyncFailTest.js --config sample/config.js `

This will upload all of the files in `sample` to the specified bucket location as well as the bedrock test runner. If you navigate to the URL that it logs, you can execute the tests on your own browser.

Use `bedrock-remote --help` to see all arguments possible.

