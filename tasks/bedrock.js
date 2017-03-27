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


    var testfiles = getFiles(settings);
    newSettings.testfiles = testfiles;

    newSettings.projectdir = process.cwd();
    newSettings.basedir = path.join(__dirname, '..');

    return newSettings;
  };

  var getFiles = function (settings) {
    var maybeFiles = extraction.files('.js')('testdir', settings.testdir);
    return attempt.cata(maybeFiles, function (err) {
      console.error('Error gathering test files', err);
      throw new Error(err);
    }, function (x) { return x; });
  };

  grunt.registerMultiTask('bedrock-manual', 'Bedrock manual test runner', function () {
    var settings = grunt.config([this.name, this.target]);

    var done = this.async();

    this.requiresConfig([this.name, this.target, 'config']);
    this.requiresConfig([this.name, this.target, 'testdir']);

    var bedrockManual = require('../src/js/bedrock-manual');
    var manualSettings = enrichSettings(settings);

    try {
      bedrockManual.go(manualSettings);
    } catch (err) {
      console.log('Error running bedrock manual', err);
    }

    setTimeout(function () {
      done();
    }, 30000);
  });

  grunt.registerMultiTask('bedrock-auto', 'Bedrock auto test runner', function () {
    var settings = grunt.config([this.name, this.target]);

    var done = this.async();

    this.requiresConfig([this.name, this.target, 'config']);
    this.requiresConfig([this.name, this.target, 'testdir']);
    this.requiresConfig([this.name, this.target, 'browser']);

    var options = this.options({
      stopOnFailure: false
    });

    var autoSettings = enrichSettings(settings);
    autoSettings.gruntDone = function (passed) {
      if (passed === false) {
        console.log('Possible error output');
        var filename = path.join(autoSettings.output, 'TEST-' + autoSettings.name) + '.xml';
        var contents = fs.readFileSync(filename, 'utf-8');
        console.log(contents);
      }
      done(passed);
    };
    autoSettings.stopOnFailure = options.stopOnFailure;

    var bedrockAuto = require('../src/js/bedrock-auto');

    try {
      bedrockAuto.go(autoSettings);
    } catch (err) {
      console.error('Error running bedrock-auto', err);
    }
  });
};