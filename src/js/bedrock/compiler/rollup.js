const rollup = require('rollup');
const typescript = require('rollup-plugin-typescript2');
const resolve = require('rollup-plugin-node-resolve');
const sourcemaps = require('rollup-plugin-sourcemaps');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

let generateImports = function (scratchFile, srcFiles) {
  var imports = srcFiles.map(function (filePath) {
    var importFilePath = path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)));

    return [
      'import "' + path.relative(path.dirname(scratchFile), importFilePath) + '";'
    ].join('\n');
  }).join('\n');

  var filePaths = srcFiles.map(function (filePath) {
    return '"' + filePath + '"';
  }).join(', ');

  return [
    imports,
    'declare let window: any;',
    'window.__testFiles = [' + filePaths + '];'
  ].join('\n');
};

let parseTsConfig = function (tsconfig) {
  return JSON.parse(fs.readFileSync(tsconfig));
};

let compile = function (tsConfigFile, scratchDir, srcFiles, success) {
  var scratchFile = path.join(scratchDir, 'compiled/tests.ts');
  var dest = path.join(scratchDir, 'compiled/tests.js');

  const outputOptions = {
    name: 'ephoxTests',
    file: dest,
    format: 'iife',
    sourcemap: true
  };

  const tsConfig = parseTsConfig(tsConfigFile);
  const include = tsConfig.include ? tsConfig.include : [];

  mkdirp.sync(path.dirname(scratchFile));
  fs.writeFileSync(scratchFile, generateImports(scratchFile, srcFiles));

  rollup.rollup({
    input: scratchFile,
    treeshake: false,
    plugins: [
      resolve({
        jsnext: true,
        customResolveOptions: {
          moduleDirectory: path.join(path.dirname(tsConfigFile), 'node_modules')
        }
      }),
      typescript({
        cacheRoot: path.join(scratchDir, 'rts2_cache'),
        tsconfig: tsConfigFile,
        verbosity: 2,
        check: false,
        // clean: true,
        tsconfigOverride: {
          compilerOptions: {
            declaration: false,
            isolatedModules: true
          },
          include: include.concat([
            path.resolve(scratchFile)
          ])
        }
      }),
      sourcemaps()
    ]
  }).then(function (bundle) {
    bundle.generate(outputOptions);
    return bundle.write(outputOptions);
  }).then(function () {
    success(dest);
  }).catch(function (err) {
    console.log(err);
    success(dest);
  });
};

module.exports = {
  compile: compile
};
