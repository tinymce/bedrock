var generate = function (projectdir, basedir, boltConfig, testfiles) {
  var path = require('path');
  var routes = require('./routes');

  var files = testfiles.map(function (filePath) {
    return path.relative(projectdir, filePath);
  });

  var routers = [
    routes.routing('/project', projectdir),
    routes.routing('/js', path.join(basedir, 'src/resources')),
    routes.routing('/lib/bolt', path.join(basedir, 'node_modules/@ephox/bolt/lib')),
    routes.routing('/lib/jquery', path.join(basedir, 'node_modules/jquery/dist')),
    routes.routing('/css', path.join(basedir, 'src/css')),
    // Very bolt specific.
    routes.json('/harness', {
      config: path.relative(projectdir, boltConfig),
      scripts: files
    })
  ];

  var fallback = routes.constant(basedir, 'src/resources/bedrock.html');

  return {
    routers: routers,
    fallback: fallback
  };
};

module.exports = {
  generate: generate
};