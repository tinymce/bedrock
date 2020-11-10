module.exports =  {
  root: true,
  parser:  '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends:  [
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions:  {
    sourceType:  'module',
  },
  rules:  {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/explicit-module-boundary-types': [ 'error', { 'allowArgumentsExplicitlyTypedAsAny': true }],

    'object-shorthand': 'error',
    'quotes': [ 'error', 'single', { 'allowTemplateLiterals': true } ],
    'semi': 'error'
  },
  env: {
    browser: true,
  }
};
