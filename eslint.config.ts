import { fileURLToPath } from 'node:url';

import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import routerPlugin from '@tanstack/eslint-plugin-router';
import { defineConfig } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

export default defineConfig(
  includeIgnoreFile(gitignorePath),
  //
  // JavaScript 파일 권장 설정입니다.
  // @see https://github.com/eslint/eslint/blob/main/packages/js/src/configs/eslint-recommended.js
  js.configs.recommended,
  //
  // TypeScript 파일 권장 설정입니다.
  // @see https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/flat/recommended.ts
  ts.configs.recommended,
  ...routerPlugin.configs['flat/recommended'],
  {
    files: ['src/frontend**/*'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['src/worker**/*'],
    languageOptions: { globals: globals.node },
  },
  //
  // JavaScript, TypeScript 공통 설정입니다.
  {
    name: '@repo/base',
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          fixStyle: 'inline-type-imports',
        },
      ],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  //
  // import 순서 규칙 설정입니다.
  // @see https://github.com/import-js/eslint-plugin-import
  {
    name: '@repo/import',
    files: ['**/*.{js,cjs,jsx,ts,cts,tsx}'],
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/internal-regex': '^(@fe|@be)/',
    },
    rules: {
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
          ],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          'newlines-between': 'always',
        },
      ],
    },
  },
);
