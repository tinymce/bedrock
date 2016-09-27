var generate = function (projectdir, basedir, page) {
  var routes = require('./routes');

  var routers = [
    routes.hostOn('GET', '/page', basedir)
  ];

  var fallback = routes.host('GET', projectdir, page);

  return {
    routers: routers,
    fallback: fallback
  };
};

module.exports = {
  generate: generate
};