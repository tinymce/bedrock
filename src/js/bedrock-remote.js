var run = function (directories) {
  var uploader = require('./bedrock/remote/uploader');
  var uploads = require('./bedrock/remote/project-uploads');
  var attempt = require('./bedrock/core/attempt');

  var clis = require('./bedrock/cli/clis.js');

  var maybeSettings = clis.forRemote(directories);

  attempt.cata(maybeSettings, clis.log, function (settings) {

    console.log('Remote Settings', settings);
    process.exit(0);

    var targets = uploads.choose(params.testDir, params.projectDirs.split(','), settings);
    uploader.upload(targets).then(function (base/* , data */) {
      console.log('Files uploaded. Note, bedrock-remote available at: ' + base);
    }, function (err) {
      console.error('error during bedrock-remote', err, err.stack);
    });

  });


};

module.exports = {
  run: run
};
