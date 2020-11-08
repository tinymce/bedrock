import * as Routes from './Routes';

export const generate = (projectdir: string, basedir: string): Routes.Runner => {
  const routers = [
    Routes.hostOn('GET', '/page', basedir)
  ];

  const fallback = Routes.host('GET', projectdir);

  return {
    routers,
    fallback
  };
};

