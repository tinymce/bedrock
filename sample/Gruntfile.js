module.exports = function(grunt) {
  grunt.initConfig({
    'bedrock-manual': {
      core: {
        config: 'config.js',
        projectdir: '../',
        files: {
          src: ['*Test.js']
        },
        testfiles: ['*PassTest.js']
      }
    },

    'bedrock-auto': {
      phantomjs: {
        browser: 'phantomjs',
        config: 'config.js',
        projectdir: '../',
        testfiles: ['*PassTest.js'],
        name: 'phantomjs'
      }
    }
  });

  require("load-grunt-tasks")(grunt);
  grunt.loadTasks("../bin/grunt-tasks");
  grunt.loadTasks("../tasks");

  grunt.registerTask("default", ["bedrock-manual"]);
};