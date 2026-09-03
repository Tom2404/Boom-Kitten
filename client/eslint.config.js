import reactPlugin from 'eslint-plugin-react';
import globals from 'globals';

export default [
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      react: reactPlugin,
    },
    rules: {
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
    },
  },
];
