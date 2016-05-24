module.exports = function(grunt) {
  grunt.initConfig({
    'bedrock-manual': {
      core: {
        config: '../sample/config.js',
        projectdir: '../',
        files: {
          src: ['../sample/*Test.js']
        }
      }
    }
  });

  require("load-grunt-tasks")(grunt);
  grunt.loadTasks("../bin/grunt-tasks");

  grunt.registerTask("default", ["bedrock-manual"]);
};
