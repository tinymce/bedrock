import * as path from 'path';
import { hasTs } from './TsUtils';

const filePathToImport = (useRequire: boolean, scratchFile: string) => {
  return (filePath: string) => {
    const importFilePath = path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)));
    let relativePath = path.relative(path.dirname(scratchFile), importFilePath);

    // make sure slashes are escaped for windows
    relativePath = relativePath.replace(/\\/g, '\\\\');

    // make sure backslashes are replaced with forward slash for the UI and JSON output string.
    // Escaping the slashes would also work, but in case we accidentally interpret them later
    // let's just go with forward slash.
    filePath = filePath.replace(/\\/g, '/');

    const importString = useRequire ? `require("${relativePath}");` : `import "${relativePath}";`;
    return `
try {
  ${importString}
} catch (e) {
  handleParseError("${filePath}", e);
}
addTest("${filePath}");`;
  };
};

const generatePolyfills = (useRequire: boolean): string[] => {
  // For IE support we need to load some polyfills
  const loadPolyfill = `if (window['Symbol'] === undefined) {
  ${useRequire ? 'window.Symbol = require(\'core-js/es/symbol\');' : 'import \'core-js/es/symbol\';'}
}`;
  return [ loadPolyfill ];
};

const generateImportsTs = (useRequire: boolean, scratchFile: string, srcFiles: string[]) => {
  const imports = srcFiles.map(filePathToImport(useRequire, scratchFile)).join('\n');
  // header code for tests.ts
  return generatePolyfills(useRequire).concat([
    `
declare let require: any;
declare let __tests: any;
declare let console: any;
let __lastTestIndex: number = -1;
const addTest = (testFilePath: string) => {
  if (__tests && __tests[__tests.length - 1]) {
    const lastTest = __tests[__tests.length - 1];
    if (!lastTest.filePath) {
      const tests = __tests.slice(__lastTestIndex + 1);
      tests.forEach((test: any) => {
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
const handleParseError = (testFilePath: string, error: any) => {
  ${useRequire ? 'const UnitTest = require(\'@ephox/bedrock-client\').UnitTest;' : 'import { UnitTest } from \'@ephox/bedrock-client\';'}
  UnitTest.test(testFilePath, () => { throw error; });
};
`,
    imports,
    '\nexport {};'
  ]).join('\n');
};

const generateImportsJs = (useRequire: boolean, scratchFile: string, srcFiles: string[]) => {
  const imports = srcFiles.map(filePathToImport(useRequire, scratchFile)).join('\n');
  // header code for tests-imports.js
  return generatePolyfills(useRequire).concat([
    `
var __lastTestIndex = -1;
var addTest = function (testFilePath) {
  if (__tests && __tests[__tests.length - 1]) {
    var lastTest = __tests[__tests.length - 1];
    if (!lastTest.filePath) {
      var tests = __tests.slice(__lastTestIndex + 1);
      tests.forEach(function (test) {
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
var handleParseError = function (testFilePath, error) {
  ${useRequire ? 'var UnitTest = require(\'@ephox/bedrock-client\').UnitTest;' : 'import { UnitTest } from \'@ephox/bedrock-client\';'}
  UnitTest.test(testFilePath, function () { throw error; });
};
`,
    imports,
    '\nexport {};'
  ]).join('\n');
};

export const generateImports = (useRequire: boolean, scratchFile: string, srcFiles: string[]) => {
  if (hasTs(srcFiles)) {
    return generateImportsTs(useRequire, scratchFile, srcFiles);
  } else {
    return generateImportsJs(useRequire, scratchFile, srcFiles);
  }
};
