import * as Routes from './Routes';

export const generate = function (projectdir, basedir) {
  const routers = [
    Routes.hostOn('GET', '/page', basedir)
  ];

  const fallback = Routes.host('GET', projectdir);

  return {
    routers: routers,
    fallback: fallback
  };
};

