import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist', 'src/pages/empresa/**', 'src/data/**', 'src/pages/publico/Confirmacion.jsx', 'src/components/Navbar.jsx'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-console': 'error',
      'no-alert': 'error',
      'no-debugger': 'error',
      'eqeqeq': ['error', 'smart'],
      'prefer-const': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/context/**/*.{js,jsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['**/*.spec.js'],
    languageOptions: {
      globals: globals.jasmine,
    },
  },
];
