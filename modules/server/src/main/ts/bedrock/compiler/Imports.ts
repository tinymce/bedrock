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
__currentTestFile = "${filePath}";
${importString}
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
  return `${generatePolyfills(useRequire)}

declare let require: any;
declare let __suites: any;
declare let console: any;
let __lastSuiteIndex: number = -1;
let __currentTestFile: string;
const addTest = (testFilePath: string) => {
  if (__suites && __suites[__suites.length - 1]) {
    const lastSuite = __suites[__suites.length - 1];
    if (!lastSuite.filePath) {
      const suites = __suites.slice(__lastSuiteIndex + 1);
      suites.forEach((suite: any) => {
        suite.filePath = testFilePath;
      });
    } else if (lastSuite.filePath === testFilePath) {
      // repeated test, duplicate the test entry
      __suites.push(__suites.slice(__lastSuiteIndex + 1));
    } else {
      console.warn('file ' + testFilePath + ' did not add a new test to the list, ignoring');
    }

    // Save the last test index
    __lastSuiteIndex = __suites.length - 1;
  } else {
    console.error('no test list to add tests to');
  }
};

window.addEventListener('error', (event: any) => { 
  ${useRequire ? 'const UnitTest = require(\'@ephox/bedrock-client\').UnitTest;' : 'import { UnitTest } from \'@ephox/bedrock-client\';'}
  UnitTest.test('Error', () => {
    if (event.error) {
      throw event.error;
    } else {
      throw new Error(event.message);
    }
  });
  addTest(__currentTestFile);
});

${imports}

export {};`;
};

const generateImportsJs = (useRequire: boolean, scratchFile: string, srcFiles: string[]) => {
  const imports = srcFiles.map(filePathToImport(useRequire, scratchFile)).join('\n');
  // header code for tests-imports.js
  return `${generatePolyfills(useRequire)}

var __lastSuiteIndex = -1;
var __currentTestFile;
var addTest = function (testFilePath) {
  if (__suites && __suites[__suites.length - 1]) {
    var lastSuite = __suites[__suites.length - 1];
    if (!lastSuite.filePath) {
      var suites = __suites.slice(__lastSuiteIndex + 1);
      suites.forEach(function (suite) {
        suite.filePath = testFilePath;
      });
    } else if (lastSuite.filePath === testFilePath) {
      // repeated test, duplicate the test entry
      __suites.push(__suites.slice(__lastSuiteIndex + 1));
    } else {
      console.warn('file ' + testFilePath + ' did not add a new test to the list, ignoring');
    }

    // Save the last test index
    __lastSuiteIndex = __suites.length - 1;
  } else {
    console.error('no test list to add tests to');
  }
};

window.addEventListener('error', function (event) {
  ${useRequire ? 'var UnitTest = require(\'@ephox/bedrock-client\').UnitTest;' : 'import { UnitTest } from \'@ephox/bedrock-client\';'}
  UnitTest.test('Error', function () {
    if (event.error) {
      throw event.error;
    } else {
      throw new Error(event.message);
    }
  });
  addTest(__currentTestFile);
});

${imports}

export {};`;
};

export const generateImports = (useRequire: boolean, scratchFile: string, srcFiles: string[]): string => {
  if (hasTs(srcFiles)) {
    return generateImportsTs(useRequire, scratchFile, srcFiles);
  } else {
    return generateImportsJs(useRequire, scratchFile, srcFiles);
  }
};
