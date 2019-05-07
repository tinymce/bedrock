module.exports = function(grunt) {
  grunt.initConfig({
    'bedrock-manual': {
      core: {
        config: 'sample/ts/tsconfig.json',
        projectdir: '../',
        files: {
          src: ['*Test.js']
        },
        testfiles: ['*PassTest.ts']
      }
    },

    'bedrock-auto': {
      phantomjs: {
        browser: 'phantomjs',
        config: 'sample/ts/tsconfig.json',
        projectdir: '../',
        testfiles: ['*PassTest.ts'],
        name: 'phantomjs'
      }
    }
  });

  require("load-grunt-tasks")(grunt);
  grunt.loadTasks("../bin/grunt-tasks");
  grunt.loadTasks("../tasks");

  grunt.registerTask("default", ["bedrock-manual"]);
};