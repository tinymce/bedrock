const path = require('path');
const fs = require('fs');
const glob = require('glob');
const Routes = require('./routes');
const Compiler = require('../compiler/Compiler');

const flatMap = function (xs, f) {
  const concat = (x, y) => x.concat(y);
  return xs.map(f).reduce(concat, []);
};

const generate = function (mode, projectdir, basedir, configFile, bundler, testfiles, chunk, retries, singleTimeout, stopOnFailure, basePage, coverage) {
  const files = testfiles.map(function (filePath) {
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


  // read the project json file to determine the project name to expose resources as `/project/${name}`
  const pkjson = JSON.parse(fs.readFileSync(`${projectdir}/package.json`));

  // Search for yarn workspace projects to use as resource folders
  const workspaceRoots = !pkjson.workspaces ? [] : flatMap(flatMap(pkjson.workspaces, (w) => glob.sync(w)), (moduleFolder) => {
    const moduleJson = `${moduleFolder}/package.json`;
    if (fs.statSync(moduleJson)) {
      const workspaceJson = JSON.parse(fs.readFileSync(moduleJson));
      return [{name: workspaceJson.name, folder: moduleFolder}];
    } else {
      return [];
    }
  });

  const resourceRoots = [{name: pkjson.name, folder: '.'}].concat(workspaceRoots);

  // console.log(`Resource maps from ${projectdir}: \n`, resourceRoots.map(({ name, folder }) => `/project/${name}/ => ${folder}`));

  const resourceRoutes = resourceRoots.map(({name, folder}) => Routes.routing('GET', `/project/${name}`, path.join(projectdir, folder)));

  const precompiledTests = (mode === 'auto' ? testGenerator.generate() : Promise.resolve(null));

  return precompiledTests.then(
    (precompTests) => {
      const routers = resourceRoutes.concat([
        // fallback resource route to project root
        Routes.routing('GET', '/project', projectdir),

        // bedrock resources
        Routes.routing('GET', '/runner', path.join(basedir, 'dist/bedrock/www/runner')),
        Routes.routing('GET', '/lib/jquery', path.dirname(require.resolve('jquery'))),
        Routes.routing('GET', '/lib/babel-polyfill', path.join(path.dirname(require.resolve('babel-polyfill')), '../dist')),
        Routes.routing('GET', '/css', path.join(basedir, 'src/css')),

        // test code
        Routes.asyncJs('GET', '/compiled/tests.js', function (done) {
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
          timeout: singleTimeout
        })
      ]);

      const fallback = Routes.constant('GET', basedir, basePage);

      return {
        routers: routers,
        fallback: fallback
      };
    }
  );
};

module.exports = {
  generate: generate
};
