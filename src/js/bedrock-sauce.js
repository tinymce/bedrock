var go = function (settings, directories) {

  var attempt = require('./bedrock/core/attempt');
  var clis = require('./bedrock/cli/clis');
  var childprocess = require('child_process');
  var dateformat = require('date-format');

  console.log('settings', settings);

  var uploader = require('./bedrock/remote/uploader');
  var uploads = require('./bedrock/remote/project-uploads');
  var distribute = require('./bedrock/remote/distribute');

  var uploadDir = settings.name + dateformat('yyyyMMddhhmmss');

  var targets = uploads.choose(settings);
  return uploader.upload(settings.bucket, settings.bucketfolder, targets).then(function (base/* , uploadData */) {
    return distribute.sequence(settings.sauceconfig, function (b) {
      var singleArgs = [
        '--remoteurl', base,
        '--name', settings.name,
        '--saucebrowser', b.browser,
        '--saucebrowserVersion', b['browser-version'] === undefined ? 'latest' : b['browser-version'],
        '--sauceos', b.os,
        '--sauceuser', settings.sauceuser,
        '--saucekey', settings.saucekey,
        '--output', settings.output
      ];

      return new Promise(function (resolve, reject) {
        var child = childprocess.fork(directories.bin + '/bedrock-sauce-single.js', singleArgs);
        child.on('message', function (info) {
          if (info.success) resolve(info.success);
          else if (info.failure) reject(info.failure);
          else console.log('unknown message', info);
        });
      });
    });
  }).then(function (/* res */) {
    console.log('SauceLabs Tests complete. Number of test files: ' + settings.testfiles.length);
  }, function (err) {
    console.log('SauceLabs Error: ', err);
    console.error(err);
  });
};

module.exports = {
  go: go,
  mode: 'forSauce'
};
