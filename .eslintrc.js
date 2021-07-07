/**
 * NPM Packages
 * eslint
 * @typescript-eslint/parser
 * @typescript-eslint/eslint-plugin
 * typescript
 * eslint-config-airbnb-base
 * eslint-plugin-import
 * prettier
 * eslint-config-prettier
 * eslint-plugin-prettier
 */
module.exports = {
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  settings: {
    'import/extensions': ['.js', '.mjs', '.jsx', '.js', '.jsx', '.ts', '.tsx'],
  },
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'import/extensions': 0,
    'import/no-unresolved': 0,
    'no-useless-escape': 0,
    'no-param-reassign': 0,
    'array-callback-return': 0,
  },
};
