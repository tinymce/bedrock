var generate = function (projectdir, basedir, boltConfig, testfiles) {
  var path = require('path');
  var routes = require('./routes');

  var files = testfiles.map(function (filePath) {
    return path.relative(projectdir, filePath);
  });

  var routers = [
    routes.routing('GET', '/project', projectdir),
    routes.routing('GET', '/js', path.join(basedir, 'src/resources')),
    routes.routing('GET', '/lib/bolt', path.join(basedir, 'node_modules/@ephox/bolt/lib')),
    routes.routing('GET', '/lib/jquery', path.join(basedir, 'node_modules/jquery/dist')),
    routes.routing('GET', '/css', path.join(basedir, 'src/css')),
    // Very bolt specific.
    routes.json('GET', '/harness', {
      config: path.relative(projectdir, boltConfig),
      scripts: files
    })
  ];

  var fallback = routes.constant('GET', basedir, 'src/resources/bedrock.html');

  return {
    routers: routers,
    fallback: fallback
  };
};

module.exports = {
  generate: generate
};