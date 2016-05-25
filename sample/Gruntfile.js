module.exports = function(grunt) {
  grunt.initConfig({
    'bedrock-manual': {
      core: {
        config: 'config.js',
        projectdir: '../',
        files: {
          src: ['*Test.js']
        }
      }
    }
  });

  require("load-grunt-tasks")(grunt);
  grunt.loadTasks("../bin/grunt-tasks");

  grunt.registerTask("default", ["bedrock-manual"]);
};
