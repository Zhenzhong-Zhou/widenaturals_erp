import { defineConfig } from 'eslint/config';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintPluginImport from 'eslint-plugin-import';

const isDev = process.env.NODE_ENV !== 'production'; // fallback workaround
const tsRecommendedConfig = tsEslint.configs.recommended;
const tsJsxRuntimeConfig = tsEslint.configs['jsx-runtime'];

const tsRecommendedRules =
  tsRecommendedConfig && 'rules' in tsRecommendedConfig
    ? tsRecommendedConfig.rules
    : {};

const tsJsxRuntimeRules =
  tsJsxRuntimeConfig && 'rules' in tsJsxRuntimeConfig
    ? tsJsxRuntimeConfig.rules
    : {};

export default defineConfig([
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
    ],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
    },
    plugins: {
      react: eslintPluginReact,
      prettier: eslintPluginPrettier,
    },
    rules: {
      'prettier/prettier': 'error',
      'no-console': isDev ? 'warn' : 'error',
      'no-debugger': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-vars': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: ['*.ts', '*.tsx'],
        },
      ],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./client/tsconfig.eslint.json'],
        tsconfigRootDir: process.cwd(),
      },
      ecmaVersion: 2023,
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tsEslint,
      prettier: eslintPluginPrettier,
      import: eslintPluginImport,
    },
    rules: {
      ...tsRecommendedRules,
      ...tsJsxRuntimeRules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'import/extensions': [
        'error',
        'ignorePackages',
        { ts: 'never', tsx: 'never' },
      ],
      'import/no-useless-path-segments': 'warn',
    },
    settings: {
      'import/resolver': {
        typescript: {},
      },
    },
  },
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        require: 'readonly',
        module: 'readonly',
      },
    },
    rules: {
      'no-process-env': 'warn',
    },
  },
]);
