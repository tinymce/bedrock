const path = require('path');

let filePathToImport = function (useRequire, scratchFile) {
  return function (filePath) {
    var importFilePath = path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)));
    var relativePath = path.relative(path.dirname(scratchFile), importFilePath);

    // make sure slashes are escaped for windows
    relativePath = relativePath.replace(/\\/g, '\\\\');

    // make sure backslashes are replaced with forward slash for the UI and JSON output string.
    // Escaping the slashes would also work, but in case we accidentally interpret them later
    // let's just go with forward slash.
    filePath = filePath.replace(/\\/g, '/');

    return [
      useRequire ? `require("${relativePath}");` : `import "${relativePath}";`, // rollup doesn't support require

      `addTest("${filePath}");`
    ].join('\n');
  };
};

let generateImports = function (useRequire, scratchFile, srcFiles) {
  var imports = srcFiles.map(filePathToImport(useRequire, scratchFile)).join('\n');

  return [
// header code for tests.ts
    `
declare let require: any;
declare let __tests: any;
declare let console: any;
const addTest = (testFilePath) => {
  if (__tests && __tests[__tests.length - 1]) {
    const lastTest = __tests[__tests.length - 1];
    if (!lastTest.filePath) {
      lastTest.filePath = testFilePath;
    } else if (lastTest.filePath === testFilePath) {
      // repeated test, duplicate the test entry
      __tests.push(lastTest);
    } else {
      console.warn('file ' + testFilePath + ' did not add a new test to the list, ignoring');
    }
  } else {
    console.error('no test list to add tests to');
  }
};
`,
    imports,
    'export {};'
  ].join('\n');
};

module.exports = {
  generateImports: generateImports
};
