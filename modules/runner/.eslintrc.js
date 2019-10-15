module.exports =  {
  root: true,
  parser:  '@typescript-eslint/parser',
  plugins: ["@typescript-eslint"],
  extends:  [
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions:  {
    sourceType:  'module',
  },
  rules:  {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/explicit-function-return-type": "off"
  },
  "env": {
    "browser": true,
  }
};
