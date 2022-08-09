/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  extends: ['plugin:vue/vue3-essential', '@vue/eslint-config-typescript/recommended', 'intolerable-style-guide'],
  parser: require.resolve('vue-eslint-parser'),
  parserOptions: {
    project: ['./tsconfig.json', './tsconfig.app.json', './tsconfig.config.json', './tsconfig.vitest.json'],
    parser: {
      js: 'espree',
      jsx: 'espree',

      ts: require.resolve('@typescript-eslint/parser'),
      tsx: require.resolve('@typescript-eslint/parser'),

      // Leave the template parser unspecified, so that it could be determined by `<script lang="...">`
    },
    extraFileExtensions: ['.vue'],
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'import/no-extraneous-dependencies': 'off',
  },
}
