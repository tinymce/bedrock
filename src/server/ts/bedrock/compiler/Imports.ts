import * as path from 'path';

const filePathToImport = function (useRequire, scratchFile) {
  return function (filePath) {
    const importFilePath = path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)));
    let relativePath = path.relative(path.dirname(scratchFile), importFilePath);

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

export const generateImports = function (useRequire, scratchFile, srcFiles) {
  const imports = srcFiles.map(filePathToImport(useRequire, scratchFile)).join('\n');
  // header code for tests.ts
  return [
    `
declare let require: any;
declare let __tests: any;
declare let console: any;
let __lastTestIndex: number = -1;
const addTest = (testFilePath) => {
  if (__tests && __tests[__tests.length - 1]) {
    const lastTest = __tests[__tests.length - 1];
    if (!lastTest.filePath) {
      const tests = __tests.slice(__lastTestIndex + 1);
      tests.forEach((test) => {
        test.filePath = testFilePath;
      });
    } else if (lastTest.filePath === testFilePath) {
      // repeated test, duplicate the test entry
      __tests.push(__tests.slice(__lastTestIndex + 1));
    } else {
      console.warn('file ' + testFilePath + ' did not add a new test to the list, ignoring');
    }
    
    // Save the last test index
    __lastTestIndex = __tests.length - 1;
  } else {
    console.error('no test list to add tests to');
  }
};
`,
    imports,
    'export {};'
  ].join('\n');
};
