module.exports = {
  'env': {
    'browser': true,
    'commonjs': true,
    'es6': true,
  },
  'extends': [
    'google',
  ],
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly',
  },
  'parserOptions': {
    'ecmaVersion': 2018,
  },
  'rules': {
    "max-len": "off",
    "space-before-function-paren": ["error", "always"],
    "comma-dangle": ["error", "never"],
    "indent": ["error", 2]
  },
};
