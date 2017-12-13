const rollup = require('rollup');
const typescript = require('rollup-plugin-typescript2');
const resolve = require('rollup-plugin-node-resolve');
const sourcemaps = require('rollup-plugin-sourcemaps');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const MagicString = require('magic-string');

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

let createIdResolver = function (filePaths) {
  var map = {};

  var resolvedPaths = filePaths.map(function (p) {
    return { filePath: p, resolved: path.resolve(p) };
  });

  resolvedPaths.forEach(function (p) {
    map[p.resolved] = p;
  });

  return function (checkPath) {
    return map.hasOwnProperty(checkPath) ? map[checkPath] : null;
  };
};

let transform = function (idResolver) {
  return function (code, id) {
    var resolvedId = idResolver(id);
    if (resolvedId) {
      var outro = [
        'if (typeof __tests !== "undefined" && __tests[__tests.length - 1] && !__tests[__tests.length - 1].filePath) {',
        '__tests[__tests.length - 1].filePath = "' + resolvedId.filePath + '";',
        '}'
      ].join('');

      var magicString = new MagicString(code);
      magicString.append('\n' + outro);

      var map = magicString.generateMap({ hires: true });
      var source = magicString.toString();

      return { code: source, file: id, map: map };
    } else {
      return null;
    }
  };
};

let compile = function (tsConfigFile, scratchDir, srcFiles, success) {
  var scratchFile = path.join(scratchDir, 'compiled/tests.ts');
  var dest = path.join(scratchDir, 'compiled/tests.js');
  var idResolver = createIdResolver(srcFiles);
  
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
            declaration: false
          },
          include: include.concat([
            path.resolve(scratchFile)
          ])
        }
      }),
      {
        name: 'attach-filenames',
        transform: transform(idResolver)
      },
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
