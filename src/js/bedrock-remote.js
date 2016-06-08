var run = function (directories) {
  var uploader = require('./bedrock/remote/uploader');
  var uploads = require('./bedrock/remote/project-uploads');
  var attempt = require('./bedrock/core/attempt');

  var clis = require('./bedrock/cli/clis.js');

  var maybeSettings = clis.forRemote(directories);

  attempt.cata(maybeSettings, function (errs) {
    console.error('Error while processing command line for bedrock-remote');
    var messages = errs.errors.join('\n');
    console.error(messages);
    console.error('\n' + errs.usage);
  }, function (settings) {

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
