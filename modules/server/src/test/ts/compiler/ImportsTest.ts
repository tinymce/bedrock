import { assert } from 'chai';
import * as fc from 'fast-check';
import { describe, it } from 'mocha';
import { convertPolyfillNameToPath, generateImports } from '../../../main/ts/bedrock/compiler/Imports';

const validPolyfills = [ 'ArrayBuffer', 'Map', 'Object', 'Promise', 'Set', 'Symbol', 'TypedArray', 'WeakMap', 'WeakSet' ];

const convertPolyfillName = (name: string) => {
  return name.slice(0, 1).toLowerCase() +
    name.slice(1).replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
};

const withGenerateFilenames = (useRequire: boolean, extension: string, test: (imports: string, filenames: string[]) => void) => {
  fc.assert(fc.property(fc.array(fc.hexaString(1, 20), 50), (filenames) => {
    const filepaths = filenames.map((name) => `/${name}.${extension}`);
    const imports = generateImports(useRequire, `/scratch.${extension}`, filepaths, []);
    test(imports, filenames);
  }));
};

describe('Imports.generateImports', () => {
  context('TypeScript', () => {
    it('should include the specified test files (require)', () => {
      withGenerateFilenames(true, 'ts', (imports, filenames) => {
        filenames.forEach((filename) => {
          assert.include(imports, `
__currentTestFile = "/${filename}.ts";
require("${filename}.ts");
addTest("/${filename}.ts");`
          );
        });
      });
    });

    it('should include the specified test files (import)', () => {
      withGenerateFilenames(false, 'ts', (imports, filenames) => {
        filenames.forEach((filename) => {
          assert.include(imports, `
__currentTestFile = "/${filename}.ts";
import "${filename}.ts";
addTest("/${filename}.ts");`
          );
        });
      });
    });
  });

  context('JavaScript', () => {
    it('should include the specified test files (require)', () => {
      withGenerateFilenames(true, 'js', (imports, filenames) => {
        filenames.forEach((filename) => {
          assert.include(imports, `
__currentTestFile = "/${filename}.js";
require("${filename}.js");
addTest("/${filename}.js");`
          );
        });
      });
    });

    it('should include the specified test files (import)', () => {
      withGenerateFilenames(false, 'js', (imports, filenames) => {
        filenames.forEach((filename) => {
          assert.include(imports, `
__currentTestFile = "/${filename}.js";
import "${filename}.js";
addTest("/${filename}.js");`
          );
        });
      });
    });
  });

  context('ESM', () => {
    it('should include the specified test files (require)', () => {
      withGenerateFilenames(true, 'mjs', (imports, filenames) => {
        filenames.forEach((filename) => {
          assert.include(imports, `
__currentTestFile = "/${filename}.mjs";
require("${filename}.mjs");
addTest("/${filename}.mjs");`
          );
        });
      });
    });

    it('should include the specified test files (import)', () => {
      withGenerateFilenames(false, 'mjs', (imports, filenames) => {
        filenames.forEach((filename) => {
          assert.include(imports, `
__currentTestFile = "/${filename}.mjs";
import "${filename}.mjs";
addTest("/${filename}.mjs");`
          );
        });
      });
    });
  });

  it('should include an error catcher for imports', () => {
    const imports = generateImports(true, '/scratch.ts', [], []);
    assert.include(imports, 'window.addEventListener(\'error\', importErrorHandler);');
    assert.include(imports, 'window.removeEventListener(\'error\', importErrorHandler);');
  });

  it('should include the specified polyfills (require)', () => {
    fc.assert(fc.property(fc.array(fc.constantFrom(...validPolyfills)), (polyfills) => {
      const imports = generateImports(true, '/scratch.ts', [], polyfills);

      polyfills.forEach((polyfill) => {
        assert.include(imports, `require('core-js/es/${convertPolyfillName(polyfill)}');`);
      });
    }));
  });

  it('should include the specified polyfills (import)', () => {
    fc.assert(fc.property(fc.array(fc.constantFrom(...validPolyfills)), (polyfills) => {
      const imports = generateImports(false, '/scratch.ts', [], polyfills);

      polyfills.forEach((polyfill) => {
        assert.include(imports, `import 'core-js/es/${convertPolyfillName(polyfill)}';`);
      });
    }));
  });
});

describe('Imports.convertPolyfillNameToPath', () => {
  it('should convert polyfill names to import paths', () => {
    assert.equal(convertPolyfillNameToPath('ArrayBuffer'), 'core-js/es/array-buffer');
    assert.equal(convertPolyfillNameToPath('Object'), 'core-js/es/object');
    assert.equal(convertPolyfillNameToPath('Promise'), 'core-js/es/promise');
    assert.equal(convertPolyfillNameToPath('Symbol'), 'core-js/es/symbol');
    assert.equal(convertPolyfillNameToPath('WeakMap'), 'core-js/es/weak-map');
    assert.equal(convertPolyfillNameToPath('WeakSet'), 'core-js/es/weak-set');
  });

  it('should convert PascalCase names to hyphen case and prefix `core-js/es/`', () => {
    fc.assert(fc.property(fc.char().filter((c) => /[a-zA-Z]/.test(c)), fc.string(), fc.string(), (char, word1, word2) => {
      const singleWord = char.toUpperCase() + word1.toLowerCase();
      const multiWord = char.toUpperCase() + word2.toLowerCase() + singleWord;

      const expectedSinglePath = char.toLowerCase() + word1.toLowerCase();
      assert.equal(convertPolyfillNameToPath(singleWord), `core-js/es/${expectedSinglePath}`, 'single word path');
      const expectedMultiPath = char.toLowerCase() + word2.toLowerCase() + '-' + expectedSinglePath;
      assert.equal(convertPolyfillNameToPath(multiWord), `core-js/es/${expectedMultiPath}`, 'multiple word path');
    }));
  });
});
