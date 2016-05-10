var run = function (directories) {
  var cli = require('./bedrock/core/cli');
  var cloption = require('./bedrock/core/cloption');
  var childprocess = require('child_process');
  var dateformat=require('date-format');

  var fs = require('fs');

  var rest = process.argv.slice(2);
  var params = cloption.parse(rest, [
    cloption.param('sauceJob', '(String): the name of the SauceLabs job (e.g. bedrock-test)', cloption.isAny, 'SAUCE_JOB'),
    cloption.param('sauceConfig', '(Filename): the filename for the browser support matrix (JSON)', cloption.validateFile, 'SAUCE_CONFIG'),
    cloption.param('sauceUser', '(String): the SauceLabs user', cloption.isAny, 'SAUCE_USER'),
    cloption.param('sauceKey', '(String): the SauceLabs key', cloption.isAny, 'SAUCE_KEY'),
    cloption.param('projectDirs', '(String): a comma-separated list of the directories to upload from the *current directory*', cloption.isAny, 'PROJECT_DIRS'),
    cloption.param('testConfig', '(Filename): the filename for the config file', cloption.validateFile, 'CONFIG_FILE'),
    cloption.files('testFiles', '{Filename ...} The set of files to test', '{ TEST1 ... }')
  ], 'bedrock-sauce');

  var settings = cli.extract(params, directories);

  var browsers = JSON.parse(fs.readFileSync(params.sauceConfig));

  var uploader = require('./bedrock/remote/uploader');
  var uploads = require('./bedrock/remote/project-uploads');
  var reporter = require('./bedrock/core/reporter');

  var distribute = require('./bedrock/remote/distribute');

  var drivers = require('./bedrock/remote/driver');


// Use when avoiding uploading.
// var base = 'http://tbio-testing.s3-website-us-west-2.amazonaws.com/tunic/sauce';

  // The base directory is based on the sauceJob and the current time.
  // "yyyyMMddHHmmss")
  var uploadDir = params.sauceJob + dateformat('yyyyMMddhhmmss');

  var targets = uploads.choose(uploadDir, params.projectDirs.split(','), settings);
  return uploader.upload(targets).then(function (base, uploadData) {

    return distribute.sequence(params.sauceConfig, function (b) {
      return new Promise(function (resolve, reject) {
        var child = childprocess.fork(directories.bin + '/bedrock-sauce-single.js', [ base, params.sauceJob, b.browser, 'latest', b.os, params.sauceUser, params.sauceKey, params.testConfig ].concat(params.testFiles));

        child.on('message', function (info) {
          if (info.success) resolve(info.success);
          else if (info.failure) reject(info.failure);
          else console.log('unknown message', info);
        });
      });
    });
  }).then(function (res) {
    console.log('all done', res);
  }, function (err) {
    console.log('Sauce Error', err);
    console.error(err);
  });
};


module.exports = {
  run: run
};
