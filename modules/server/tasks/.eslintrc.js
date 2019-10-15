module.exports = {
  root: true,
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: 11,
    sourceType: "module",
    ecmaFeatures: {
      impliedStrict: true
    }
  },
  rules: {
    "no-var": "error",
    "prefer-const": "error",
    "curly": ["error", "multi-line"],
    "object-curly-spacing": "off",
    "array-bracket-spacing": "off",
    "space-before-function-paren": "off",
    "no-trailing-spaces": "off",
    "indent": ["error", 2],
    "max-len": "off",
    "no-prototype-builtins": "off"
  },
  "env": {
    "node": true
  }
};
