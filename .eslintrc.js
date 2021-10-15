/* eslint-disable */
module.exports = {
  root: true,
  ignorePatterns: ['node_modules', 'dist', 'vite.config.*'],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint'
  ],
  extends: [
    'eslint:recommended',
    'plugin:react/all',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    'react/react-in-jsx-scope': 0,
    'react/jsx-filename-extension': [1, { 'extensions': ['.tsx'] }],
    'react/jsx-indent': [1, 2],
    'react/jsx-indent-props': [1, 2],
    'react/jsx-wrap-multilines': [
      2, {
        'declaration': 'parens-new-line',
        'assignment': 'parens-new-line',
        'return': 'parens-new-line',
        'arrow': 'parens-new-line',
        'condition': 'parens-new-line',
        'logical': 'parens-new-line',
        'prop': 'parens-new-line'
      }],
    'react/jsx-no-literals': 0,
    'react/jsx-props-no-spreading': 0
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
}
