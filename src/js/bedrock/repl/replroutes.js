var generate = function (projectdir, basedir, boltConfig, replConfig) {
  console.log('arguments', arguments);
  var path = require('path');
  var routes = require('../server/routes');

  // Duplication with boltroutes
  var routers = [
    routes.routing('GET', '/project', projectdir),
    routes.routing('GET', '/js', path.join(basedir, 'src/resources')),
    routes.routing('GET', '/lib/bolt', path.join(basedir, 'node_modules/@ephox/bolt/lib')),
    routes.routing('GET', '/lib/jquery', path.join(basedir, 'node_modules/jquery/dist')),
    // Very bolt specific.
    routes.json('GET', '/repl', {
      config: path.relative(projectdir, boltConfig),
      repl: path.relative(projectdir, replConfig)
    })
  ];

  var fallback = routes.constant('GET', basedir, 'src/resources/repl.html');

  return {
    routers: routers,
    fallback: fallback
  };
};

module.exports = {
  generate: generate
};