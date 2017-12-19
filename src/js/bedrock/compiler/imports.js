var path = require('path');

let filePathToImport = function (useRequire, scratchFile) {
  return function (filePath) {
    var importFilePath = path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)));
    var relativePath = path.relative(path.dirname(scratchFile), importFilePath);

    // make sure slashes are escaped for windows
    relativePath = relativePath.replace(/\\/g, '\\\\');

    return [
      useRequire ? 'require("' + relativePath + '");' : 'import "' + relativePath + '";', // rollup doesn't support require
      'if (__tests && __tests[__tests.length - 1] && !__tests[__tests.length - 1].filePath) {',
      '__tests[__tests.length - 1].filePath = "' + filePath + '";',
      '}'
    ].join('\n');
  };
};

let generateImports = function (useRequire, scratchFile, srcFiles) {
  var imports = srcFiles.map(filePathToImport(useRequire, scratchFile)).join('\n');

  return [
    imports,
    'declare let window: any;',
    'declare let __tests: any;'
  ].join('\n');
};

module.exports = {
  generateImports: generateImports
};
