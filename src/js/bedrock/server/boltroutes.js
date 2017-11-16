var generate = function (projectdir, basedir, configFile, testfiles, stopOnFailure, basePage) {
  var path = require('path');
  var fs = require('fs');
  var routes = require('./routes');
  var webpack = require('../compiler/webpack');

  var files = testfiles.map(function (filePath) {
    return path.relative(projectdir, filePath);
  });

  var jsFiles = files.filter(function (filePath) {
    return path.extname(filePath) !== '.ts';
  });
  
  var tsFiles = files.filter(function (filePath) {
    return path.extname(filePath) === '.ts';
  });

  var routers = [
    routes.routing('GET', '/project', projectdir),
    routes.routing('GET', '/js', path.join(basedir, 'src/resources')),
    routes.routing('GET', '/lib/bolt', path.join(path.dirname(require.resolve('@ephox/bolt')), '../lib')),
    routes.routing('GET', '/lib/jquery', path.dirname(require.resolve('jquery'))),
    routes.routing('GET', '/lib/babel-polyfill', path.join(path.dirname(require.resolve('babel-polyfill')), '../dist')),
    routes.routing('GET', '/css', path.join(basedir, 'src/css')),
    routes.asyncJs('GET', '/compiled/tests.js', function (done) {
      if (tsFiles.length > 0) {
        webpack.compile(
          path.join(projectdir, configFile),
          path.join(projectdir, 'scratch/compiled'),
          tsFiles,
          function (compiledJsFilePath) {
            done(fs.readFileSync(compiledJsFilePath));
          }
        );
      } else {
        done('');
      }
    }),
    routes.routing('GET', '/compiled', path.join(projectdir, 'scratch/compiled')),
    // Very bolt specific.
    routes.json('GET', '/harness', {
      config: path.relative(projectdir, configFile),
      scripts: jsFiles,
      stopOnFailure: stopOnFailure
    })
  ];

  var fallback = routes.constant('GET', basedir, basePage);

  return {
    routers: routers,
    fallback: fallback
  };
};

module.exports = {
  generate: generate
};
