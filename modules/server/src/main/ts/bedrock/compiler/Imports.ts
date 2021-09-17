import * as path from 'path';
import { hasTs } from './TsUtils';

export const convertPolyfillNameToPath = (name: string): string => {
  const path = name.slice(0, 1).toLowerCase() +
               name.slice(1).replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  return `core-js/es/${path}`;
};

const filePathToImport = (useRequire: boolean, scratchFile: string) => {
  return (filePath: string) => {
    let relativePath = path.relative(path.dirname(scratchFile), filePath);

    // make sure backslashes are replaced for windows, as import paths should always use forward slashes
    relativePath = relativePath.replace(/\\/g, '/');

    // make sure backslashes are replaced with forward slash for the UI and JSON output string.
    filePath = filePath.replace(/\\/g, '/');

    const importString = useRequire ? `require("${relativePath}");` : `import "${relativePath}";`;
    return `
__currentTestFile = "${filePath}";
${importString}
addTest("${filePath}");`;
  };
};

const generatePolyfillImport = (useRequire: boolean, importPath: string) => {
  return useRequire ? `require('${importPath}');` : `import '${importPath}';`;
};

const generatePolyfills = (useRequire: boolean, polyfills: Record<string, string>): string => {
  const polyfillImports: string[] = [];
  Object.keys(polyfills).forEach((name) => {
    const path = polyfills[name];
    polyfillImports.push(`if (window['${name}'] === undefined) {
  ${generatePolyfillImport(useRequire, path)}
}`);
  });
  return polyfillImports.join('\n');
};

const generateImportsTs = (useRequire: boolean, scratchFile: string, srcFiles: string[], polyfills: Record<string, string>) => {
  const imports = srcFiles.map(filePathToImport(useRequire, scratchFile)).join('\n');
  // header code for tests.ts
  return `${generatePolyfills(useRequire, polyfills)}

declare let require: any;
declare let __tests: any[];
declare let console: any;
let __lastTestIndex: number = -1;
let __currentTestFile: string;
const addTest = (testFilePath: string) => {
  if (typeof __tests !== 'undefined' && __tests[__tests.length - 1]) {
    const lastTest = __tests[__tests.length - 1];
    if (!lastTest.file) {
      const tests = __tests.slice(__lastTestIndex + 1);
      tests.forEach((test: any) => {
        test.file = testFilePath;
      });
    } else if (lastTest.file === testFilePath) {
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

const importErrorHandler = (event: any) => { 
  ${useRequire ? 'const UnitTest = require(\'@ephox/bedrock-client\').UnitTest;' : 'import { UnitTest } from \'@ephox/bedrock-client\';'}
  UnitTest.test('Error', () => {
    if (event.error) {
      throw event.error;
    } else {
      throw new Error(event.message);
    }
  });
  addTest(__currentTestFile);
};

window.addEventListener('error', importErrorHandler);
${imports}
window.removeEventListener('error', importErrorHandler);

export {};`;
};

const generateImportsJs = (useRequire: boolean, scratchFile: string, srcFiles: string[], polyfills: Record<string, string>) => {
  const imports = srcFiles.map(filePathToImport(useRequire, scratchFile)).join('\n');
  // header code for tests-imports.js
  return `${generatePolyfills(useRequire, polyfills)}

var __lastTestIndex = -1;
var __currentTestFile;
var addTest = function (testFilePath) {
  if (typeof __tests !== 'undefined' && __tests[__tests.length - 1]) {
    var lastTest = __tests[__tests.length - 1];
    if (!lastTest.file) {
      var tests = __tests.slice(__lastTestIndex + 1);
      tests.forEach(function (test) {
        test.file = testFilePath;
      });
    } else if (lastTest.file === testFilePath) {
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

var importErrorHandler = function (event) {
  ${useRequire ? 'var UnitTest = require(\'@ephox/bedrock-client\').UnitTest;' : 'import { UnitTest } from \'@ephox/bedrock-client\';'}
  UnitTest.test('Error', function () {
    if (event.error) {
      throw event.error;
    } else {
      throw new Error(event.message);
    }
  });
  addTest(__currentTestFile);
};

window.addEventListener('error', importErrorHandler);
${imports}
window.removeEventListener('error', importErrorHandler);

export {};`;
};

export const generateImports = (useRequire: boolean, scratchFile: string, srcFiles: string[], polyfills: string[]): string => {
  const polyfillPaths: Record<string, string> = {};
  polyfills.forEach((name) => {
    polyfillPaths[name] = convertPolyfillNameToPath(name);
  });

  const f = hasTs(srcFiles) ? generateImportsTs : generateImportsJs;
  return f(useRequire, scratchFile, srcFiles, polyfillPaths);
};
