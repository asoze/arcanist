module.exports = {
  root: true,
  extends: [
    'expo',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  plugins: ['react', 'react-hooks'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  env: {
    browser: true,
    es2022: true,
  },
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    'react/prop-types': 'warn',
    'react/react-in-jsx-scope': 'off',
  },
  ignorePatterns: ['node_modules/', 'builds/', 'coverage/', '*.config.js'],
};
