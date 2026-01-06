// eslint.config.js
import path from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
})

// module.exports = [
export default [
  ...compat.extends('plugin:@typescript-eslint/recommended'),
  {
    files: ['**/*.{ts,tsx,js,jsx}'],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
      },
    },

    plugins: {
      '@typescript-eslint': tsPlugin,
    },

    // Equivalent of env: { browser: true }
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
      },
    },

    rules: {
      // Typescript-eslint rules
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_'
        },
      ],
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/explicit-module-boundary-types': [
        'error',
        { allowArgumentsExplicitlyTypedAsAny: true },
      ],

      // Core stylistic rules
      'arrow-spacing': 'error',
      'no-multi-spaces': ['error', { ignoreEOLComments: true }],
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'object-shorthand': 'error',
      'quotes': ['error', 'single', { allowTemplateLiterals: true }],
      'space-before-function-paren': [
        'error',
        { anonymous: 'always', named: 'never' },
      ],
      'semi': 'error',
      'spaced-comment': 'error',
      'space-infix-ops': 'error',
      'space-unary-ops': 'error',
      'space-before-blocks': 'error',
    },
  },
];
