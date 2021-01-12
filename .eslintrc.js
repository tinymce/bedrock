module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'plugin:@typescript-eslint/recommended'
  ],
  parserOptions: {
    sourceType: 'module'
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': [ 'warn', {
      vars: 'all',
      args: 'after-used',
      ignoreRestSiblings: true,
      argsIgnorePattern: '^_'
    }],
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/explicit-module-boundary-types': [ 'error', { 'allowArgumentsExplicitlyTypedAsAny': true } ],
    '@typescript-eslint/no-inferrable-types': 'off',

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
  },
  env: {
    browser: true,
  }
};