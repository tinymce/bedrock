var go = function (settings, directories) {
  var version = require('./bedrock/core/version');
  var childprocess = require('child_process');
  var dateformat = require('date-format');

  var uploader = require('./bedrock/remote/uploader');
  var uploads = require('./bedrock/remote/project-uploads');

  var uploadDir = settings.bucketfolder + '/' + settings.name + '-' + dateformat('yyyyMMddhhmmss');

  var targets = uploads.choose(settings);

  // read the JSON file early so we fail before uploading if it doesn't parse
  var sauceContents = require('fs').readFileSync(settings.sauceconfig);
  var browsers = JSON.parse(sauceContents);

  return uploader.upload(settings.bucket, uploadDir, targets).then(function (base/* , uploadData */) {
    console.log('bedrock-sauce ' + version);
    console.log(`TEST URL: ${base} (bedrock assumes you use US west 2)

This URL will self destruct in 48 hours (assuming you've configured the server correctly)`);

    var promises = browsers.map(function (b) {
      var singleArgs = [
        '--remoteurl', base,
        '--name', settings.name,
        '--saucebrowser', b.browser,
        '--saucebrowserVersion', b['browser-version'] === undefined ? 'latest' : b['browser-version'],
        '--sauceos', b.os,
        '--sauceuser', settings.sauceuser,
        '--saucekey', settings.saucekey,
        '--saucebuild', settings.saucebuild,
        '--output', settings.output,
        '--singleTimeout', settings.singleTimeout,
        // Really confusing rename ... consider just using totalTimeout
        '--totalTimeout', settings.overallTimeout
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

    return Promise.all(promises);
  }).then(function (/* res */) {
    console.log('SauceLabs Tests complete. Number of test files: ' + settings.testfiles.length);
  }, function (err) {
    console.log('SauceLabs Error in platform: ', err);
  });
};

module.exports = {
  go: go,
  mode: 'forSauce'
};
