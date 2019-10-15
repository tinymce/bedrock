module.exports = {
  root: true,
  parser:  '@typescript-eslint/parser',
  plugins: ["@typescript-eslint"],
  extends:  [
    'plugin:@typescript-eslint/recommended',
  ],
  'env': {
    'commonjs': true,
    'es6': true,
    "node": true
  },
  'globals': {
  },
  'parserOptions': {
    'sourceType': 'module',
  },
  'rules': {
    "max-len": "off",
    "space-before-function-paren": ["error", "always"],
    "comma-dangle": ["error", "never"],
    "indent": ["error", 2],
    "require-jsdoc": "off",
    "prefer-promise-reject-errors": "off",
    "prefer-spread": "off",
    "no-prototype-builtins": "off",

    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-unused-vars": "off"
  },
};
