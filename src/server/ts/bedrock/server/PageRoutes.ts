import * as Routes from './Routes';

const generate = function (projectdir, basedir, page) {
  const routers = [
    Routes.hostOn('GET', '/page', basedir)
  ];

  const fallback = Routes.host('GET', projectdir, page);

  return {
    routers: routers,
    fallback: fallback
  };
};

module.exports = {
  generate: generate
};
