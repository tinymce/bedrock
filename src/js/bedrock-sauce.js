var run = function (directories) {

  var attempt = require('./bedrock/core/attempt');
  var clis = require('./bedrock/cli/clis');
  var childprocess = require('child_process');
  var dateformat = require('date-format');

  var maybeSettings = clis.forSauce(directories);
  attempt.cata(maybeSettings, clis.log, function (settings) {
    console.log('settings', settings);
    process.exit(0);

    var uploader = require('./bedrock/remote/uploader');
    var uploads = require('./bedrock/remote/project-uploads');
    var distribute = require('./bedrock/remote/distribute');

  // Use when avoiding uploading.
  // var base = 'http://tbio-testing.s3-website-us-west-2.amazonaws.com/tunic/sauce';

    var uploadDir = params.sauceJob + dateformat('yyyyMMddhhmmss');

    var targets = uploads.choose(uploadDir, params.projectDirs.split(','), settings);
    return uploader.upload(targets).then(function (base/* , uploadData */) {
      return distribute.sequence(params.sauceConfig, function (b) {
        return new Promise(function (resolve, reject) {
          var child = childprocess.fork(directories.bin + '/bedrock-sauce-single.js', [
            base,
            params.sauceJob,
            b.browser,
            b['browser-version'] === undefined ? 'latest' : b['browser-version'],
            b.os,
            params.sauceUser,
            params.sauceKey,
            params.outputDir,
            params.testConfig
          ].concat(params.testFiles));
          child.on('message', function (info) {
            if (info.success) resolve(info.success);
            else if (info.failure) reject(info.failure);
            else console.log('unknown message', info);
          });
        });
      });
    }).then(function (/* res */) {
      console.log('SauceLabs Tests complete. Number of test files: ' + params.testFiles.length);
    }, function (err) {
      console.log('SauceLabs Error: ', err);
      console.error(err);
    });
  });
};

module.exports = {
  run: run
};
