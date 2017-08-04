var go = function (settings) {
  var uploader = require('./bedrock/remote/uploader');
  var uploads = require('./bedrock/remote/project-uploads');
  var version = require('./bedrock/core/version');

  var targets = uploads.choose(settings);
  uploader.upload(settings.bucket, settings.bucketfolder, targets).then(function (base/* , data */) {
    console.log('Files uploaded. Note, bedrock-remote ' + version + ' available at: ' + base);
  }, function (err) {
    console.error('error during bedrock-remote', err, err.stack);
  });
};

module.exports = {
  go: go,
  mode: 'forRemote'
};
