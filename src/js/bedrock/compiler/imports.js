var path = require('path');

let filePathToImport = function (scratchFile) {
  return function (filePath) {
    var importFilePath = path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)));

    return [
      'import "' + path.relative(path.dirname(scratchFile), importFilePath) + '";',
      'if (__tests && __tests[__tests.length - 1] && !__tests[__tests.length - 1].filePath) {',
      '__tests[__tests.length - 1].filePath = "' + filePath + '";',
      '}'
    ].join('\n');
  };
};

let generateImports = function (scratchFile, srcFiles) {
  var imports = srcFiles.map(filePathToImport(scratchFile)).join('\n');

  return [
    imports,
    'declare let window: any;',
    'declare let __tests: any;'
  ].join('\n');
};

module.exports = {
  generateImports: generateImports
};
