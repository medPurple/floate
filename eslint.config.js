/**
 * ESLint flat config (ESLint 9+).
 *
 * Périmètre : src/ (front, browser globals) + server/ (Node globals).
 * Pas de Prettier ici, le formatage reste manuel — l'ESLint sert
 * juste à attraper les vrais bugs (variables non utilisées, refs
 * morts, etc.) sans dicter le style.
 */
import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import globals from 'globals'

export default [
  {
    ignores: [
      'dist/**',
      'storybook-static/**',
      'node_modules/**',
      'server/node_modules/**',
      '.vite/**',
      'public/**'
    ]
  },

  // Base JS recommandée
  js.configs.recommended,

  // Vue 3 recommandé (flat)
  ...vue.configs['flat/recommended'],

  // Front : src/ avec globals browser
  {
    files: ['src/**/*.{js,vue}'],
    languageOptions: {
      parser: vueParser,
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser
      }
    },
    rules: {
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-empty': ['warn', { allowEmptyCatch: true }],

      // Vue rules — on tempère ce qui crierait sur du code legitime
      'vue/require-default-prop': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/attribute-hyphenation': ['warn', 'always'],
      'vue/no-v-html': 'warn',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': ['warn', {
        html: { void: 'always', normal: 'always', component: 'always' }
      }]
    }
  },

  // Serveur : Node globals, pas de Vue
  {
    files: ['server/**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    },
    rules: {
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-empty': ['warn', { allowEmptyCatch: true }]
    }
  },

  // Tests Node — autorise les globals de node:test si on en utilisait
  {
    files: ['server/test/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        fetch: 'readonly'
      }
    }
  }
]
