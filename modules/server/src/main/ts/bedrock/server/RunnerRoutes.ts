import * as path from 'path';
import * as fs from 'fs';
import * as childProcess from 'child_process';
import * as glob from 'glob';
import * as Routes from './Routes';
import * as Compiler from '../compiler/Compiler';
import * as FileUtils from '../util/FileUtils';
import * as Arr from '../util/Arr';

interface PackageJson {
  readonly name: string;
  readonly workspaces: string[];
}

interface WorkspaceRoot {
  name: string;
  folder: string;
}

export const generate = async (mode: string, projectdir: string, basedir: string, configFile: string, bundler: 'webpack' | 'rollup' | 'rspack', testfiles: string[], chunk: number,
                               retries: number, singleTimeout: number, stopOnFailure: boolean, basePage: string, coverage: string[], polyfills: string[]): Promise<Routes.Runner> => {
  const files = testfiles.map((filePath) => {
    return path.relative(projectdir, filePath);
  });

  const testGenerator = Compiler.compile(
    bundler,
    path.join(projectdir, configFile),
    path.join(projectdir, 'scratch'),
    basedir,
    mode === 'auto',
    files,
    coverage,
    polyfills
  );

  // read the project json file to determine the project name to expose resources as `/project/${name}`
  const pkjson: PackageJson = FileUtils.readFileAsJson(`${projectdir}/package.json`);

  // Search for yarn workspace projects to use as resource folders
  const findWorkspaceResources = (moduleFolder: string): Array<WorkspaceRoot> => {
    const moduleJson = `${moduleFolder}/package.json`;
    if (fs.statSync(moduleJson)) {
      const workspaceJson = FileUtils.readFileAsJson(moduleJson);
      return [{name: workspaceJson.name, folder: moduleFolder}];
    } else {
      return [];
    }
  };

  const findPnpmWorkspaces = async (): Promise<WorkspaceRoot[]> => {
    if (!fs.existsSync(path.join(projectdir, 'pnpm-workspace.yaml'))) {
      return [];
    }

    return new Promise<WorkspaceRoot[]>((resolve, reject) =>
      childProcess.exec('pnpm list -r --only-projects --json', (err, stdout, stderr) => {
        if (stderr) console.error(stderr);
        if (err) {
          reject(err);
          return;
        }

        const result: WorkspaceRoot[] = [];
        for (const p of JSON.parse(stdout) as { name: string; path: string }[]) {
          const folder = path.relative(projectdir, p.path);
          if (!folder.length) continue;
          result.push({ name: p.name, folder });
        }
        resolve(result);
      })
    );
  };

  const workspaceRoots: WorkspaceRoot[] = (
    pkjson.workspaces
      ? Arr.bind2(pkjson.workspaces, (w) => glob.sync(w), findWorkspaceResources)
      : await findPnpmWorkspaces()
  );

  const resourceRoots = [{name: pkjson.name, folder: '.'}].concat(workspaceRoots);

  // console.log(`Resource maps from ${projectdir}: \n`, resourceRoots.map(({ name, folder }) => `/project/${name}/ => ${folder}`));

  const nodeModuleRoutes = resourceRoots.map(({name, folder}) => Routes.nodeResolve('GET', `/project/${name}/node_modules`, path.join(projectdir, folder)));

  const resourceRoutes = resourceRoots.map(({name, folder}) => Routes.routing('GET', `/project/${name}`, path.join(projectdir, folder)));

  const precompiledTests = mode === 'auto' ? await testGenerator.generate() : null;

  const routers = [
    ...nodeModuleRoutes,
    ...resourceRoutes,
    ...[
      Routes.nodeResolve('GET', '/project/node_modules', projectdir),

      // fallback resource route to project root
      Routes.routing('GET', '/project', projectdir),

      // bedrock resources
      Routes.routing('GET', '/runner', path.join(require.resolve('@ephox/bedrock-runner'), '../../../../../dist')),
      Routes.routing('GET', '/lib/jquery', path.dirname(require.resolve('jquery'))),
      Routes.routing('GET', '/lib/core-js-bundle', path.dirname(require.resolve('core-js-bundle'))),
      Routes.routing('GET', '/css', path.join(basedir, 'src/resources/css')),
      Routes.nodeResolveFile('GET', '/mockServiceWorker.js', projectdir, 'msw', 'lib/mockServiceWorker.js'),

      // test code
      Routes.asyncJs('GET', '/compiled/tests.js', (done) => {
        if (precompiledTests !== null) {
          done(precompiledTests);
        } else {
          testGenerator.generate().then(done);
        }
      }),
      Routes.routing('GET', '/compiled', path.join(projectdir, 'scratch/compiled')),

      // harness API
      Routes.json('GET', '/harness', {
        stopOnFailure,
        chunk,
        retries,
        timeout: singleTimeout,
        mode
      })
    ]
  ];

  const fallback = Routes.constant('GET', basedir, basePage);

  return {
    routers,
    fallback
  };
};
