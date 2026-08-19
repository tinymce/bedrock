import type { Linter } from 'eslint';
import * as js from '@eslint/js';
import * as tseslint from '@typescript-eslint/eslint-plugin';
import * as espree from 'espree';
import * as globals from 'globals';

const config: Linter.Config[] = [
  {
    ignores: ['**/lib/**', '**/dist/**', '**/scratch/**']
  },
  ...(tseslint.configs['flat/recommended'] as Linter.Config[]),
  {
    languageOptions: {
      globals: {
        ...globals.browser
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': [ 'warn', {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/explicit-module-boundary-types': [ 'error', { 'allowArgumentsExplicitlyTypedAsAny': true } ],

      'arrow-spacing': 'error',
      'no-multi-spaces': [ 'error', { ignoreEOLComments: true }],
      'no-multiple-empty-lines': [ 'error', { 'max': 1 } ],
      'object-shorthand': 'error',
      'quotes': [ 'error', 'single', { 'allowTemplateLiterals': true } ],
      'space-before-function-paren': [ 'error', { anonymous: 'always', named: 'never' } ],
      'semi': 'error',
      'spaced-comment': 'error',
      'space-infix-ops': 'error',
      'space-unary-ops': 'error',
      'space-before-blocks': 'error',
    }
  },
  {
    // Plain JS grunt tasks, previously governed by their own root:true .eslintrc.js
    // rather than the TypeScript config above, so every typescript-eslint rule
    // picked up from the shared config above needs to be turned back off here.
    files: ['modules/server/tasks/**/*.js'],
    languageOptions: {
      parser: espree,
      ecmaVersion: 11,
      sourceType: 'commonjs',
      globals: {
        ...globals.node
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      ...Object.fromEntries(Object.keys(tseslint.rules).map((name) => [ `@typescript-eslint/${name}`, 'off' ])),
      'no-var': 'error',
      'prefer-const': 'error',
      'curly': [ 'error', 'multi-line' ],
      'object-curly-spacing': 'off',
      'array-bracket-spacing': 'off',
      'space-before-function-paren': 'off',
      'no-trailing-spaces': 'off',
      'indent': [ 'error', 2 ],
      'max-len': 'off',
      'no-prototype-builtins': 'off'
    }
  }
];

export default config;
