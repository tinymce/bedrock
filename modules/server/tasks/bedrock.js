// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cloptions = require('../lib/main/ts/bedrock/cli/ClOptions');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bedrockManual = require('../lib/main/ts/BedrockManual');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bedrockAuto = require('../lib/main/ts/BedrockAuto');

module.exports = function (grunt) {

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

    const testfiles = getFiles(settings.testfiles);

    newSettings.testfiles = testfiles;

    newSettings.projectdir = settings.projectdir !== undefined ? settings.projectdir : process.cwd();
    newSettings.basedir = path.dirname(__dirname);

    return newSettings;
  };

  const getFiles = function (testfiles) {
    return grunt.file.expand(testfiles);
  };

  grunt.registerMultiTask('bedrock-manual', 'Bedrock manual test runner', function () {
    const settings = grunt.config([this.name, this.target]);

    // We don't keep a reference because we never call done on purpose.
    // This is a never ending task
    this.async();

    this.requiresConfig([this.name, this.target, 'config']);
    this.requiresConfig([this.name, this.target, 'testfiles']);

    const manualSettings = enrichSettings(settings);
    grunt.log.verbose.writeln('Bedrock manual settings', manualSettings);

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
    autoSettings.stopOnFailure = options.stopOnFailure || autoSettings.stopOnFailure;
    grunt.log.verbose.writeln('Bedrock auto settings', autoSettings);

    try {
      bedrockAuto.go(autoSettings);
    } catch (err) {
      grunt.log.error('Error running bedrock-auto', err);
    }
  });
};
