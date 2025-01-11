import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

/** @type {[{ignores: string[]},{files: string[], languageOptions: {ecmaVersion: number, sourceType: string}, plugins: {react: {deprecatedRules: typeof deprecatedRules; rules: typeof allRules; configs: typeof configs & {flat?: Record<string, ReactFlatConfig>}} | plugin | *, prettier: ESLint.Plugin}, rules: {'prettier/prettier': string, 'no-console': string, 'no-debugger': string, 'react/react-in-jsx-scope': string, 'react/jsx-uses-vars': string}, settings: {react: {version: string}}},{files: string[], languageOptions: {parser: {clearCaches: () => void; ParserServices: ParserServicesWithoutTypeInformation | ParserServicesWithTypeInformation; ParserOptions: ParserOptions; parseForESLint: (code: (string | ts.SourceFile), parserOptions?: (ParserOptions | null)) => ParseForESLintResult; meta: {name: string; version: string}; ParserServicesWithoutTypeInformation: ParserServicesWithoutTypeInformation; ParserServicesWithTypeInformation: ParserServicesWithTypeInformation; parse: (code: (string | ts.SourceFile), options?: ParserOptions) => ParseForESLintResult["ast"]; version: string; createProgram: (configFile: string, projectDirectory?: string) => ts.Program; withoutProjectParserOptions: <Options extends object>(opts: Options) => Omit<Options, "EXPERIMENTAL_useProjectService" | "project" | "projectService">}, ecmaVersion: number, sourceType: string}, plugins: {'@typescript-eslint': {configs: Record<string, ClassicConfig.Config>; meta: FlatConfig.PluginMeta; rules: typeof rules}, prettier: ESLint.Plugin}, rules: {'prettier/prettier': string, '@typescript-eslint/no-unused-vars': string, '@typescript-eslint/no-explicit-any': string, '@typescript-eslint/explicit-module-boundary-types': string}},{files: string[], languageOptions: {globals: {process: string, __dirname: string, require: string, module: string}}, rules: {'no-process-env': string, 'no-console': string}}]} */
const config = [
  // Ignore unnecessary files and directories
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
  // Base configuration for JavaScript and JSX
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023, // Enable ECMAScript 2023 features
      sourceType: 'module', // Use ES Modules
    },
    plugins: {
      react: eslintPluginReact,
      prettier: eslintPluginPrettier,
    },
    rules: {
      'prettier/prettier': 'error', // Enforce Prettier formatting
      'no-console': 'warn', // Warn for console usage
      'no-debugger': 'error', // Disallow debugger usage
      'react/react-in-jsx-scope': 'off', // Not required for React 17+
      'react/jsx-uses-vars': 'error', // Ensure variables in JSX are used
    },
    settings: {
      react: {
        version: 'detect', // Auto-detect React version
      },
    },
  },
  // Configuration for TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2023,
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tsEslint,
      prettier: eslintPluginPrettier,
    },
    rules: {
      'prettier/prettier': 'error', // Enforce Prettier formatting
      '@typescript-eslint/no-unused-vars': 'warn', // Warn for unused variables
      '@typescript-eslint/no-explicit-any': 'warn', // Discourage `any` usage
      '@typescript-eslint/explicit-module-boundary-types': 'off', // Optional module boundary typing
    },
  },
  // Node.js backend-specific rules
  {
    files: ['**/*.{js,ts}'], // Target both JS and TS for the backend
    languageOptions: {
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        require: 'readonly',
        module: 'readonly',
      },
    },
    rules: {
      'no-process-env': 'warn', // Warn if process.env is used directly
      'no-console': 'off', // Allow console in backend
    },
  },
];

export default config;
