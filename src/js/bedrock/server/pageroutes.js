const generate = function (projectdir, basedir, page) {
  const routes = require('./routes');

  const routers = [
    routes.hostOn('GET', '/page', basedir)
  ];

  const fallback = routes.host('GET', projectdir, page);

  return {
    routers: routers,
    fallback: fallback
  };
};

module.exports = {
  generate: generate
};
