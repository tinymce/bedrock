var generate = function (projectdir, basedir, boltConfig, replConfig) {
  var path = require('path');
  var routes = require('../server/routes');

  var repl = path.relative(projectdir, replConfig);

  var fs = require('fs');

  var replFile = fs.readFileSync(repl);
  var replContents = JSON.parse(replFile);

  var scripts = replContents.scripts !== undefined ? replContents.scripts : [ ];
  var allScript = scripts.reduce(function (b, script) {
    var sContents = fs.readFileSync(script);
    return b + '\n' + sContents;
  }, '');

  // Duplication with boltroutes
  var routers = [
    routes.routing('GET', '/project', projectdir),
    routes.routing('GET', '/js', path.join(basedir, 'src/resources')),

    routes.routing('GET', '/lib/bolt', path.join(path.dirname(require.resolve('@ephox/bolt')), '../lib')),
    routes.routing('GET', '/lib/jquery', path.dirname(require.resolve('jquery'))),
    routes.rewrite('GET', projectdir, '/bingo', path.relative(projectdir, boltConfig)),
    // Very bolt specific.
    routes.json('GET', '/repl', {
      config: path.relative(projectdir, boltConfig),
      repl: replContents,
      script: allScript
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
