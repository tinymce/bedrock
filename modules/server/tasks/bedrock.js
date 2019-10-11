const path = require('path');
const cloptions = require('../lib/main/ts/bedrock/cli/ClOptions');
const bedrockManual = require('../lib/main/ts/BedrockManual');
const bedrockAuto = require('../lib/main/ts/BedrockAuto');

module.exports = function(grunt) {

  const bucketize = function(array, bucket, buckets) {
    return array.filter(function(x, i) {
      return i % buckets === (bucket - 1);
    })
  };

  const enrichSettings = function (settings) {
    const newSettings = { };

    for (const j in cloptions) {
      const clo = cloptions[j];
      const outputKey = clo.output !== undefined ? clo.output : clo.name;
      if (clo.defaultValue !== undefined) newSettings[outputKey] = clo.defaultValue;
    }

    for (const k in settings) {
      newSettings[k] = settings[k];
    }

    if (newSettings.bucket > newSettings.buckets) {
      // TODO: does this validation belong elsewhere?
      throw new Error("Bucket number too high. Can't run bucket " + settings.bucket + " of " + settings.buckets + ". Note: bucket numbers are 1-based.");
    }

    if (newSettings.bucket <= 0) {
      // TODO: does this validation belong elsewhere?
      throw new Error("Bucket number too low. Note: bucket numbers are 1-based.");
    }

    console.log("Running bucket " + newSettings.bucket + " of " + newSettings.buckets);

    const testfiles = getFiles(settings.testfiles, newSettings.bucket, newSettings.buckets);

    newSettings.testfiles = testfiles;

    newSettings.projectdir = settings.projectdir !== undefined ? settings.projectdir : process.cwd();
    newSettings.basedir = path.dirname(__dirname);

    return newSettings;
  };

  const getFiles = function (testfiles, bucket, buckets) {
    const all = grunt.file.expand(testfiles);
    return bucketize(all, bucket, buckets);
  };

  grunt.registerMultiTask('bedrock-manual', 'Bedrock manual test runner', function () {
    const settings = grunt.config([this.name, this.target]);
    
    // We don't keep a reference because we never call done on purpose. 
    // This is a never ending task
    this.async(); 

    this.requiresConfig([this.name, this.target, 'config']);
    this.requiresConfig([this.name, this.target, 'testfiles']);

    const manualSettings = enrichSettings(settings);

    try {
      bedrockManual.go(manualSettings);
    } catch (err) {
      grunt.log.error('Error running bedrock manual', err);
    }
  });

  grunt.registerMultiTask('bedrock-auto', 'Bedrock auto test runner', function () {
    const settings = grunt.config([this.name, this.target]);

    const done = this.async();

    this.requiresConfig([this.name, this.target, 'config']);
    this.requiresConfig([this.name, this.target, 'testfiles']);
    this.requiresConfig([this.name, this.target, 'browser']);

    const options = this.options({
      stopOnFailure: false
    });

    const autoSettings = enrichSettings(settings);
    autoSettings.gruntDone = function (passed) {
      done(passed);
    };
    autoSettings.stopOnFailure = options.stopOnFailure;

    try {
      bedrockAuto.go(autoSettings);
    } catch (err) {
      grunt.log.error('Error running bedrock-auto', err);
    }
  });
};
