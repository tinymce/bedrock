var generate = function (projectdir, basedir, page) {
  var path = require('path');
  var routes = require('./routes');

  var routers = [
    routes.hostOn('/page', basedir)
  ];

  var fallback = routes.host(projectdir, page);

  return {
    routers: routers,
    fallback: fallback
  };
};

module.exports = {
  generate: generate
};