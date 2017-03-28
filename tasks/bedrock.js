module.exports = function(grunt) {
  var serve = require('../src/js/bedrock/server/serve');
  var cloptions = require('../src/js/bedrock/cli/cloptions');
  var extraction = require('../src/js/bedrock/cli/extraction');
  var attempt = require('../src/js/bedrock/core/attempt');

  var path = require('path');
  var fs = require('fs');

  var enrichSettings = function (settings) {
    var newSettings = { };

    for (var j in cloptions) {
      var clo = cloptions[j];
      var outputKey = clo.output !== undefined ? clo.output : clo.name;
      if (clo.defaultValue !== undefined) newSettings[outputKey] = clo.defaultValue;
    }

    for (var k in settings) {
      newSettings[k] = settings[k];
    }

    var testfiles = getFiles(settings.testfiles);
    newSettings.testfiles = testfiles;

    newSettings.projectdir = process.cwd();
    newSettings.basedir = path.dirname(__dirname);

    return newSettings;
  };

  var getFiles = function (testfiles) {
    return grunt.file.expand(testfiles);
  };

  grunt.registerMultiTask('bedrock-manual', 'Bedrock manual test runner', function () {
    var settings = grunt.config([this.name, this.target]);
    
    // We don't keep a reference because we never call done on purpose. 
    // This is a never ending task
    this.async(); 

    this.requiresConfig([this.name, this.target, 'config']);
    this.requiresConfig([this.name, this.target, 'testfiles']);

    var bedrockManual = require('../src/js/bedrock-manual');
    var manualSettings = enrichSettings(settings);

    try {
      bedrockManual.go(manualSettings);
    } catch (err) {
      grunt.log.error('Error running bedrock manual', err);
    }
  });

  grunt.registerMultiTask('bedrock-auto', 'Bedrock auto test runner', function () {
    var settings = grunt.config([this.name, this.target]);

    var done = this.async();

    this.requiresConfig([this.name, this.target, 'config']);
    this.requiresConfig([this.name, this.target, 'testfiles']);
    this.requiresConfig([this.name, this.target, 'browser']);

    var options = this.options({
      stopOnFailure: false
    });

    var autoSettings = enrichSettings(settings);
    autoSettings.gruntDone = function (passed) {
      done(passed);
    };
    autoSettings.stopOnFailure = options.stopOnFailure;

    var bedrockAuto = require('../src/js/bedrock-auto');

    try {
      bedrockAuto.go(autoSettings);
    } catch (err) {
      grunt.log.error('Error running bedrock-auto', err);
    }
  });
};