const eslintPluginReact = require('eslint-plugin-react');
const eslintPluginPrettier = require('eslint-plugin-prettier');

/** @type {import("eslint").Linter.FlatConfig[]} */
const config = [
  {
    ignores: [
      'node_modules',
      'dist',
      'build',
      '*.log',
      '*.lock',
      '*.config.js',
      'coverage/',
      '.next/',
    ], // Files/directories to ignore
  },
  {
    files: ['**/*.{js,jsx}'], // Target JavaScript and JSX files
    languageOptions: {
      ecmaVersion: 2021, // ECMAScript 2021 features
      sourceType: 'module', // Enable ES Modules
    },
    plugins: {
      react: eslintPluginReact,
      prettier: eslintPluginPrettier,
    },
    rules: {
      'prettier/prettier': 'error', // Enforce Prettier formatting
      'no-console': 'warn', // Warn when console.log is used
      'no-debugger': 'error', // Disallow debugger statements
      'react/react-in-jsx-scope': 'off', // Not required for React 17+
      'react/jsx-uses-vars': 'error', // Ensure variables in JSX are used
    },
    settings: {
      react: {
        version: 'detect', // Auto-detect React version
      },
    },
  },
];

module.exports = config;
