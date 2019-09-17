import * as Routes from './Routes';

export const generate = (projectdir: string, basedir: string) => {
  const routers = [
    Routes.hostOn('GET', '/page', basedir)
  ];

  const fallback = Routes.host('GET', projectdir);

  return {
    routers: routers,
    fallback: fallback
  };
};

