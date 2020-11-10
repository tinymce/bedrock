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
    '@typescript-eslint/no-empty-function': 'off',

    'object-shorthand': 'error',
    'quotes': [ 'error', 'single', { 'allowTemplateLiterals': true } ],
    'semi': 'error'
  },
  env: {
    browser: true,
  }
};
