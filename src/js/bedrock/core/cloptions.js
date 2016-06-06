  var cloption = require('./cloption.js');
  var usage = require('command-line-usage');

  // Note, this is a blend of the previous hand-rolled cloption approach and
  // the existing npm package: command-line-arguments
  var name = {
    name: 'name',
    alias: 'n',
    type: String,
    defaultValue: 'bedrock-run-' + new Date().getTime(),
    description: 'The name of the test run. It is used in reporting data.',
    validate: cloption.isAny
  };

  var output = {
    name: 'output',
    alias: 'o',
    type: String,
    defaultValue: 'scratch',
    description: 'The destination directory of the test reports',
    validate: cloption.isAny
  };

  var browser = {
    name: 'browser',
    alias: 'b',
    type: String,
    required: true,
    description: 'The name of the browser to launch',
    validate: cloption.isOneOf([
      'ie',
      'firefox',
      'MicrosoftEdge',
      'chrome',
      'safari'
    ])
  };

  var configTo = function (defaultValue) {
    return {
      name: 'config',
      alias: 'c',
      type: String,
      defaultValue: defaultValue,
      description: 'The location of the bolt config file',
      validate: cloption.validateFile
    };
  };

  var config = configTo('config/bolt/browser.js');

  var files = {
    name: 'files',
    alias: 'f',
    type: String,
    multiple: true,
    incompatible: [
      'testdir'
    ],
    description: 'The list of files to test',
    validate: cloption.validateFile
  };

  var testdir = {
    name: 'testdir',
    output: 'files',
    alias: 'd',
    type: String,
    description: 'The directory containing all the files to test',
    validate: cloption.listDirectory('Test.js')
  };

  var validateOne = function (defn, settings) {
    return defn.validate(defn.name, settings[defn.name]);
  };

  var validateMany = function (defn, settings) {
    return settings[defn.name].map(function (f) {
      return defn.validate(defn.name, f);
    });
  };

  var validate = function (definitions, settings) {
    try {
      definitions.forEach(function (defn) {
        if (defn.required === true && settings[defn.name] === undefined) throw 'Setting: ' + defn.name + ' must be specified.';
        if (settings[defn.name] !== undefined) {
          var incompatible = defn.incompatible !== undefined ? defn.incompatible : [];
          incompatible.forEach(function (n) {
            if (settings[n] !== undefined) throw 'Setting: ' + defn.name + ' is incompatible with: ' + n;
          });
        }
      });

      var result = {};
      definitions.forEach(function (defn) {
        if (settings[defn.name] !== undefined) {
          var newValue = defn.multiple === true ? validateMany(defn, settings) : validateOne(defn, settings);
          var output = defn.output !== undefined ? defn.output : defn.name;
          result[output] = newValue;
        }
      });
      return result;
    } catch (err) {
      console.error('\n** Error processing command line arguments.\n');
      console.error(err);

      console.error(usage([
        { header: 'bedrock', content: 'bedrock' },
        { header: 'Options', optionList: definitions }
      ]));

      process.exit(0);
    }
  };

  module.exports = {
    name: name,
    output: output,
    browser: browser,
    config: config,
    configTo: configTo,
    files: files,
    testdir: testdir,
    validate: validate
  };