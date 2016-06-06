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
    cloptions.browser
  ];

  var settings = commandLineArgs(definitions);

  try {
    definitions.forEach(function (defn) {
      if (defn.required === true && settings[defn.name] === undefined) throw 'Setting: ' + defn.name + ' must be specified.';
    });

    definitions.forEach(function (defn) {
      if (settings[defn.name] !== undefined) defn.validate(defn.name, settings[defn.name]);
    });
  } catch (err) {
    console.error('\n** Error processing command line arguments.\n');
    console.error(err);

    console.error(usage([
      { header: 'bedrock', content: 'bedrock' },
      { header: 'Options', optionList: definitions }
    ]));
    process.exit(0);
  }

  // cloption.param('suiteName', '(String): Name for the test suite', cloption.isAny, 'SUITE_NAME'),
  //   // INVESTIGATE: Maybe this directory should be deleted each time.
  //   cloption.param('outputDir', '(Filename): Output directory for test file. If it does not exist, it is created.', cloption.isAny, 'OUTPUT_DIR'),
  //   // INVESTIGATE: Do validation on the browser name (e.g. cloption.inSet([ '...' ]))
  //   cloption.param('browser', '(String): Browser value: chrome | firefox | safari | ie | MicrosoftEdge', cloption.isAny, 'BROWSER'),
  //   cloption.param('testConfig', '(Filename): the filename for the config file', cloption.validateFile, 'CONFIG_FILE'),
  //   cloption.files('testFiles', '{Filename ...} The set of files to test', '{ TEST1 ... }')

  console.log('settings', settings);



};

module.exports = {
  run: run
};
