module.exports = {
  parser:  '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends:  [
    'plugin:@typescript-eslint/recommended'
  ],
  parserOptions: {
    sourceType: 'module'
  },
  rules: {
    'curly': ['error', 'multi-line'],
    'object-curly-spacing': 'off',
    'array-bracket-spacing': 'off',
    'space-before-function-paren': 'off',
    'no-trailing-spaces': 'off',
    'indent': ['error', 2],
    'max-len': 'off',
    'no-prototype-builtins': 'off',
    'object-shorthand': 'error',
    'quotes': [ 'error', 'single', { 'allowTemplateLiterals': true } ],
    'semi': 'error'
  },
  env: {
    node: true
  }
};
