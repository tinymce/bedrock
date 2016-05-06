var run = function (directories) {
  var cli = require('./bedrock/core/cli');
  
  var settings = cli.extract(directories);
  var uploader = require('./bedrock/remote/uploader');
  var uploads = require('./bedrock/remote/project-uploads');

  var targets = uploads.choose('hack', settings);
  uploader.upload(targets).then(function () {
    console.log('Success!');
  }, function (err) {
    console.error('Error', err, err.stack);
  });
};


module.exports = {
  run: run
};
