require

module.exports = function(grunt) {
  grunt.initConfig({
    'bedrock-manual': {
      core: {
        config: 'tsconfig.json',
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
        config: 'tsconfig.json',
        projectdir: '../',
        testfiles: ['*PassTest.ts'],
        name: 'phantomjs'
      }
    }
  });

  require('load-grunt-tasks')(grunt, {
    requireResolution: true,
    config: 'package.json',
    pattern: ['@ephox/bedrock-server', 'grunt-shell']
  });

  grunt.registerTask("default", ["bedrock-manual"]);
};
