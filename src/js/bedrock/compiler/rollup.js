const rollup = require('rollup');
const typescript = require('rollup-plugin-typescript2');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

let generateImports = function (scratchFile, srcFiles) {
  var imports = srcFiles.map(function (filePath) {
    return [
      'import "' + path.relative(path.dirname(scratchFile), filePath) + '";'
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

let compile = function (tsconfig, scratchFile, srcFiles, dest) {
  const outputOptions = {
    name: 'ephoxTests',
    file: dest,
    format: 'iife',
    sourcemap: 'inline' // Might choke the client on huge projects
  };

  const tsConfig = parseTsConfig(tsconfig);
  const include = tsConfig.include ? tsConfig.include : [];

  mkdirp.sync(path.dirname(scratchFile));
  fs.writeFileSync(scratchFile, generateImports(scratchFile, srcFiles));

  return rollup.rollup({
    input: scratchFile,
    plugins: [
      typescript({
        tsconfig: tsconfig,
        tsconfigOverride: {
          compilerOptions: {
            declaration: false
          },
          include: include.concat([
            path.resolve(scratchFile)
          ])
        }
      })
    ]
  }).then(function (bundle) {
    bundle.generate(outputOptions);
    return bundle.write(outputOptions);
  }).catch(function (err) {
    console.log(err);
  });
};

module.exports = {
  compile: compile
};
