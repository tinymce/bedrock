var run = function (directories) {
  var cli = require('./bedrock/core/cli');
  var cloption = require('./bedrock/core/cloption');

  var rest = process.argv.slice(2);
  var params = cloption.parse(rest, [
    cloption.param('testDir', '(String): the subdirectory for the s3 bucket', cloption.isAny, 'TEST_DIR'),
    cloption.param('projectDirs', '(String): a comma-separated list of the directories to upload from the *current directory*', cloption.isAny, 'PROJECT_DIRS'),
    cloption.param('testConfig', '(Filename): the filename for the config file', cloption.validateFile, 'CONFIG_FILE'),
    cloption.files('testFiles', '{Filename ...} The set of files to test', '{ TEST1 ... }')
  ], 'bedrock-remote');

  var settings = cli.extract(params, directories);
  var uploader = require('./bedrock/remote/uploader');
  var uploads = require('./bedrock/remote/project-uploads');

  var targets = uploads.choose(params.testDir, params.projectDirs.split(','), settings);
  uploader.upload(targets).then(function (base/* , data */) {
    console.log('Files uploaded. Note, bedrock-remote available at: ' + base);
  }, function (err) {
    console.error('error during bedrock-remote', err, err.stack);
  });
};

module.exports = {
  run: run
};
