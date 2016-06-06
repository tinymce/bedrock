var run = function (directories) {
  var commandLineArgs = require('command-line-args');
  var usage = require('command-line-usage');

  var cloptions = require('./bedrock/core/cloptions.js');

  var validBrowser = function (s) {
    if (s === 'chrome' || s === 'safari' || s === 'firefox' || s === 'MicrosoftEdge' || s === 'ie') return s;
    throw 'Unknown browser: ' + s;
  };

  var definitions = [
    cloptions.name,
    cloptions.output,
    cloptions.browser,
    cloptions.config,
    cloptions.testdir,
    cloptions.files
  ];

  var settings = commandLineArgs(definitions);

  var newSettings = cloptions.validate(definitions, settings);

  console.log('settings', newSettings);



};

module.exports = {
  run: run
};
