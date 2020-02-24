import * as path from 'path';
import * as fs from 'fs';
import * as glob from 'glob';
import * as Routes from './Routes';
import * as Compiler from '../compiler/Compiler';
import * as FileUtils from '../util/FileUtils'
import * as Arr from '../util/Arr';

interface Runner {
  routers: Routes.Route[];
  fallback: Routes.Route;
}

export const generate = (mode: string, projectdir: string, basedir: string, configFile: string, bundler: 'webpack' | 'rollup', testfiles: string[], chunk: number, retries: number, singleTimeout: number, stopOnFailure: boolean, basePage: string, coverage: string[]): Promise<Runner> => {
  const files = testfiles.map((filePath) => {
    return path.relative(projectdir, filePath);
  });

  const testGenerator = Compiler.compile(
    path.join(projectdir, configFile),
    path.join(projectdir, 'scratch'),
    basedir,
    mode === 'auto',
    files,
    coverage
  );

  interface PackageJson {
    name: string;
    workspaces: string[];
  }

  // read the project json file to determine the project name to expose resources as `/project/${name}`
  const pkjson: PackageJson = FileUtils.readFileAsJson(`${projectdir}/package.json`);

  // Search for yarn workspace projects to use as resource folders
  const findWorkspaceResources = (moduleFolder: string): Array<{name: string; folder: string}> => {
    const moduleJson = `${moduleFolder}/package.json`;
    if (fs.statSync(moduleJson)) {
      const workspaceJson = FileUtils.readFileAsJson(moduleJson);
      return [{name: workspaceJson.name, folder: moduleFolder}];
    } else {
      return [];
    }
  };
  const workspaceRoots = (
    pkjson.workspaces
      ? Arr.bind2(pkjson.workspaces, (w) => glob.sync(w), findWorkspaceResources)
      : []
  );

  const resourceRoots = [{name: pkjson.name, folder: '.'}].concat(workspaceRoots);

  // console.log(`Resource maps from ${projectdir}: \n`, resourceRoots.map(({ name, folder }) => `/project/${name}/ => ${folder}`));

  const resourceRoutes = resourceRoots.map(({name, folder}) => Routes.routing('GET', `/project/${name}`, path.join(projectdir, folder)));

  const precompiledTests: Promise<Buffer | string | null> = (mode === 'auto' ? testGenerator.generate() : Promise.resolve(null));

  return precompiledTests.then(
    (precompTests) => {
      const routers = resourceRoutes.concat([
        // fallback resource route to project root
        Routes.routing('GET', '/project', projectdir),

        // bedrock resources
        Routes.routing('GET', '/runner', path.join(require.resolve('@ephox/bedrock-runner'), '../../../../../dist')),
        Routes.routing('GET', '/lib/jquery', path.dirname(require.resolve('jquery'))),
        Routes.routing('GET', '/lib/core-js-bundle', path.dirname(require.resolve('core-js-bundle'))),
        Routes.routing('GET', '/css', path.join(basedir, 'src/resources/css')),

        // test code
        Routes.asyncJs('GET', '/compiled/tests.js', (done) => {
          if (precompTests !== null) {
            done(precompTests);
          } else {
            testGenerator.generate().then(done);
          }
        }),
        Routes.routing('GET', '/compiled', path.join(projectdir, 'scratch/compiled')),

        // harness API
        Routes.json('GET', '/harness', {
          stopOnFailure: stopOnFailure,
          chunk: chunk,
          retries: retries,
          timeout: singleTimeout,
          mode: mode
        })
      ]);

      const fallback = Routes.constant('GET', basedir, basePage);

      return {
        routers,
        fallback
      };
    }
  );
};
