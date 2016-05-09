var run = function (directories) {
  var cli = require('./bedrock/core/cli');
  var cloption = require('./bedrock/core/cloption');

  var rest = process.argv.slice(2);
  var params = cloption.parse(rest, [
    cloption.param('testConfig', '(Filename): the filename for the config file', cloption.validateFile, 'CONFIG_FILE'),
    cloption.files('testFiles', '{Filename ...} The set of files to test', '{ TEST1 ... }')
  ], 2, 'Usage');

  var settings = cli.extract(params, directories);
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
