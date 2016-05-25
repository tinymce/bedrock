module.exports = function(grunt) {
  var serve = require('../../src/js/bedrock/server/serve');
  var path = require('path');

  grunt.registerMultiTask("bedrock-manual", "Bedrock manual test runner", function () {
    var settings = grunt.config([this.name, this.target]);

    this.async();
    this.requiresConfig([this.name, this.target, 'config']);
    this.requiresConfig([this.name, this.target, 'files']);

    var serveSettings = {
      projectdir: path.resolve(settings.projectdir),
      basedir: path.join(__dirname, '../..'),
      config: settings.config,
      testfiles: this.filesSrc,
      driver: null
    };

    serve.start(serveSettings, function (service/* , done */) {
      console.log('bedrock (manual) available at: http://localhost:' + service.port);
    });
  });
};
